package dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

import config.DatabaseConfig;
import models.Customer;
import models.Employee;

public class UserDAO {

    // 1. Пошук КЛІЄНТА за Email (для логіну)
    public Customer getCustomerByEmail(String email) {
        String sql = "SELECT * FROM customers WHERE email = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, email);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new Customer(
                        rs.getInt("customer_id"),
                        rs.getString("lastName"),
                        rs.getString("firstName"),
                        rs.getString("phoneNumber"),
                        rs.getString("email"),
                        rs.getString("residentialAddress")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка при пошуку клієнта за email: " + e.getMessage());
        }
        return null;
    }

    // 2. РЕЄСТРАЦІЯ КЛІЄНТА (INSERT в базу даних)
    public boolean registerCustomer(Customer customer) {
        String sql = "INSERT INTO customers (lastName, firstName, phoneNumber, email, residentialAddress) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            pstmt.setString(1, customer.getLastName());
            pstmt.setString(2, customer.getFirstName());
            pstmt.setString(3, customer.getPhoneNumber());
            pstmt.setString(4, customer.getEmail());
            pstmt.setString(5, customer.getResidentialAddress()); // Тут на початку передамо null або пустий рядок

            int affectedRows = pstmt.executeUpdate();
            if (affectedRows > 0) {
                // Отримуємо згенерований базою AUTO_INCREMENT ID
                try (ResultSet generatedKeys = pstmt.getGeneratedKeys()) {
                    if (generatedKeys.next()) {
                        customer.setCustomerId(generatedKeys.getInt(1));
                    }
                }
                return true;
            }
        } catch (SQLException e) {
            System.err.println("Помилка при реєстрації клієнта: " + e.getMessage());
        }
        return false;
    }

    // 3. Пошук СПІВРОБІТНИКА за логіном (для Адміна/Менеджера)
    public Employee getEmployeeByLogin(String login) {
        String sql = "SELECT * FROM employees WHERE login = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, login);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    return new Employee(
                        rs.getInt("employee_id"),
                        rs.getString("lastName"),
                        rs.getString("firstName"),
                        rs.getString("middleName"),
                        rs.getString("login"),
                        rs.getString("position")
                    );
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка при пошуку співробітника за логіном: " + e.getMessage());
        }
        return null;
    }

    // 4. ОНОВЛЕННЯ ДАНИХ КЛІЄНТА (З особистого кабінету)
    public boolean updateCustomer(Customer customer) {
        String sql = "UPDATE customers SET lastName = ?, firstName = ?, phoneNumber = ?, residentialAddress = ? WHERE customer_id = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, customer.getLastName());
            pstmt.setString(2, customer.getFirstName());
            pstmt.setString(3, customer.getPhoneNumber());
            pstmt.setString(4, customer.getResidentialAddress());
            pstmt.setInt(5, customer.getCustomerId());

            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Помилка при виконанні UPDATE клієнта: " + e.getMessage());
        }
        return false;
    }

    // --- ДОДАТИ В КЛАС UserDAO.java ---
    // Отримання історії замовлень клієнта з підрахунком кількості позицій
    public List<java.util.Map<String, Object>> getCustomerOrders(int customerId) {
        List<java.util.Map<String, Object>> ordersList = new ArrayList<>();
        String sql = "SELECT o.order_id, o.creationDate, o.orderStatus, o.totalPrice, " +
                     "COUNT(oi.order_item_id) AS total_items " +
                     "FROM orders o " +
                     "LEFT JOIN order_items oi ON o.order_id = oi.order_id " +
                     "WHERE o.customer_id = ? " +
                     "GROUP BY o.order_id, o.creationDate, o.orderStatus, o.totalPrice " +
                     "ORDER BY o.creationDate DESC";

        try (Connection conn = config.DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, customerId);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> order = new java.util.HashMap<>();
                    order.put("orderId", rs.getInt("order_id"));
                    order.put("creationDate", rs.getString("creationDate"));
                    order.put("orderStatus", rs.getString("orderStatus"));
                    order.put("totalPrice", rs.getDouble("totalPrice"));
                    order.put("totalItems", rs.getInt("total_items"));
                    ordersList.add(order);
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка отримання історії замовлень клієнта: " + e.getMessage());
        }
        return ordersList;
    }

    // --- ДОДАТИ В КЛАС UserDAO.java ---
    // ТРАНЗАКЦІЙНЕ ОФОРМЛЕННЯ ЗАМОВЛЕННЯ (Схема Master-Detail)
    public boolean checkoutOrder(int customerId, double totalPrice, List<java.util.Map<String, Object>> cartItems) {
        String orderSql = "INSERT INTO orders (customer_id, employee_id, creationDate, orderStatus, totalPrice) VALUES (?, NULL, NOW(), 'Pending', ?)";
        String itemSql = "INSERT INTO order_items (order_id, product_id, quantity, unitPrice) VALUES (?, ?, ?, ?)";
        
        Connection conn = null;
        try {
            conn = config.DatabaseConfig.getConnection();
            conn.setAutoCommit(false); // Вмикаємо суворий режим транзакції ACID

            int generatedOrderId = 0;
            
            // 1. Вносимо головний запис у таблицю 'orders'
            try (PreparedStatement pstmt = conn.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
                pstmt.setInt(1, customerId);
                pstmt.setDouble(2, totalPrice);
                pstmt.executeUpdate();
                
                try (ResultSet rs = pstmt.getGeneratedKeys()) {
                    if (rs.next()) generatedOrderId = rs.getInt(1);
                }
            }

            // 2. Вносимо деталі замовлення в циклі в таблицю 'order_items'
            if (generatedOrderId > 0) {
                try (PreparedStatement pstmt = conn.prepareStatement(itemSql)) {
                    for (java.util.Map<String, Object> item : cartItems) {
                        // Розбираємо прихований JSON-пакет з фронтенду
                        int productId = ((Double) item.get("productId")).intValue();
                        int quantity = ((Double) item.get("quantity")).intValue();
                        double unitPrice = (Double) item.get("unitPrice");

                        pstmt.setInt(1, generatedOrderId);
                        pstmt.setInt(2, productId);
                        pstmt.setInt(3, quantity);
                        pstmt.setDouble(4, unitPrice);
                        pstmt.addBatch(); // Додаємо до пакетного виконання
                    }
                    pstmt.executeBatch(); // Виконуємо масовий інсерт за один такт СУБД
                }
            }

            conn.commit(); // Завершуємо транзакцію успішно
            return true;
        } catch (SQLException e) {
            System.err.println("Помилка транзакції замовлення кошика! Відкат... " + e.getMessage());
            if (conn != null) {
                try { conn.rollback(); } catch (SQLException ex) { ex.printStackTrace(); }
            }
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException e) { e.printStackTrace(); }
            }
        }
        return false;
    }
}