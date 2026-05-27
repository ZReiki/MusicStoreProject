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
            pstmt.setString(5, customer.getResidentialAddress());

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

    // Отримання історії замовлень клієнта з підрахунком кількості позицій
    public List<java.util.Map<String, Object>> getCustomerOrders(int customerId) {
        List<java.util.Map<String, Object>> ordersList = new ArrayList<>();
        
        String sql = "SELECT o.order_id, o.creationDate, o.orderStatus, o.totalPrice, " +
                     "IFNULL(SUM(oi.quantity), 0) AS total_items " +
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
                    order.put("totalItems", rs.getInt("total_items")); // Тепер тут буде 5, а не 1
                    ordersList.add(order);
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка отримання історії замовлень: " + e.getMessage());
        }
        return ordersList;
    }

    // ТРАНЗАКЦІЙНЕ ОФОРМЛЕННЯ ЗАМОВЛЕННЯ (Схема Master-Detail)
    public boolean checkoutOrder(int customerId, double totalPrice, List<java.util.Map<String, Object>> cartItems) {
        String checkStockSql = "SELECT productName, quantity FROM products WHERE product_id = ?";
        String orderSql = "INSERT INTO orders (customer_id, employee_id, creationDate, orderStatus, totalPrice) VALUES (?, NULL, NOW(), 'Pending', ?)";
        String itemSql = "INSERT INTO order_items (order_id, product_id, quantity, unitPrice) VALUES (?, ?, ?, ?)";
        String updateStockSql = "UPDATE products SET quantity = quantity - ? WHERE product_id = ?";
        
        Connection conn = null;
        try {
            conn = config.DatabaseConfig.getConnection();
            conn.setAutoCommit(false); // Вмикаємо ACID режим ручного контролю транзакції

            // КРОК 0: Серверна сувора перевірка залишків (захист від паралельних покупок)
            for (java.util.Map<String, Object> item : cartItems) {
                int productId = ((Double) item.get("productId")).intValue();
                int requestedQty = ((Double) item.get("quantity")).intValue();

                try (PreparedStatement pstmt = conn.prepareStatement(checkStockSql)) {
                    pstmt.setInt(1, productId);
                    try (ResultSet rs = pstmt.executeQuery()) {
                        if (rs.next()) {
                            int actualStock = rs.getInt("quantity");
                            String prodName = rs.getString("productName");
                            if (actualStock < requestedQty) {
                                // Якщо товару не вистачає, ми кидаємо виняток, який скасує (rollback) всю транзакцію
                                throw new SQLException("Недостатньо одиниць товару '" + prodName + "' на складі! Доступно: " + actualStock + " шт.");
                            }
                        } else {
                            throw new SQLException("Товар з ID " + productId + " не знайдено в СУБД!");
                        }
                    }
                }
            }

            int generatedOrderId = 0;
            
            // КРОК 1: Вносимо головний запис у таблицю 'orders'
            try (PreparedStatement pstmt = conn.prepareStatement(orderSql, Statement.RETURN_GENERATED_KEYS)) {
                pstmt.setInt(1, customerId);
                pstmt.setDouble(2, totalPrice);
                pstmt.executeUpdate();
                
                try (ResultSet rs = pstmt.getGeneratedKeys()) {
                    if (rs.next()) generatedOrderId = rs.getInt(1);
                }
            }

            // КРОК 2: Вносимо деталі чека в 'order_items' та паралельно списуємо залишки
            if (generatedOrderId > 0) {
                try (PreparedStatement pstmtItem = conn.prepareStatement(itemSql);
                     PreparedStatement pstmtStock = conn.prepareStatement(updateStockSql)) {
                    
                    for (java.util.Map<String, Object> item : cartItems) {
                        int productId = ((Double) item.get("productId")).intValue();
                        int quantity = ((Double) item.get("quantity")).intValue();
                        double unitPrice = (Double) item.get("unitPrice");

                        // Додаємо запис у пакет чека order_items
                        pstmtItem.setInt(1, generatedOrderId);
                        pstmtItem.setInt(2, productId);
                        pstmtItem.setInt(3, quantity);
                        pstmtItem.setDouble(4, unitPrice);
                        pstmtItem.addBatch();

                        // Додаємо оновлення складу у пакет списання products
                        pstmtStock.setInt(1, quantity);
                        pstmtStock.setInt(2, productId);
                        pstmtStock.addBatch();
                    }
                    
                    pstmtItem.executeBatch();  // Масовий інсерт позицій
                    pstmtStock.executeBatch(); // Масове зменшення кількості на складі
                }
            }

            conn.commit(); // Зберігаємо всі зміни каскадно та атомарно
            return true;
        } catch (SQLException e) {
            System.err.println("Помилка транзакції оформлення! Виконуємо повний відкат від змін СУБД: " + e.getMessage());
            if (conn != null) {
                try { 
                    conn.rollback(); // Повертаємо БД до початкового стану
                } catch (SQLException ex) { 
                    ex.printStackTrace(); 
                }
            }
            // Передаємо повідомлення про помилку залишків нагору в контролер
            throw new RuntimeException(e.getMessage());
        } finally {
            if (conn != null) {
                try { conn.setAutoCommit(true); conn.close(); } catch (SQLException e) { e.printStackTrace(); }
            }
        }
    }
}