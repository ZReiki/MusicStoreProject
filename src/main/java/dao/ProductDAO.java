package dao;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import config.DatabaseConfig;
import models.*; // Імпортуємо всі моделі з пакету

public class ProductDAO {

    // 1. Твій існуючий метод (залишається без змін)
    // 1. ОНОВЛЕНИЙ МЕТОД: Збір усього каталогу з усіма характеристиками (ISA Hierarchy JOIN)
    public List<Product> getAllProducts() {
        List<Product> products = new ArrayList<>();
        
        // Зв'язуємо базову таблицю з усіма чотирма підтаблицями за їхніми PK/FK
        String sql = "SELECT p.*, " +
                     "g.type AS g_type, g.neckMaterial, g.bodyMaterial AS g_body, g.numberOfFrets, g.numberOfStrings, g.pickupType, " +
                     "k.type AS k_type, k.polyphony, k.numberOfKeys, k.keySensetivity, " +
                     "d.type AS d_type, d.configuration, d.bodyMaterial AS d_body, " +
                     "w.type AS w_type, w.material, w.scaleRange " +
                     "FROM products p " +
                     "LEFT JOIN guitars g ON p.product_id = g.product_id " +
                     "LEFT JOIN keyboards k ON p.product_id = k.product_id " +
                     "LEFT JOIN drums d ON p.product_id = d.product_id " +
                     "LEFT JOIN winds w ON p.product_id = w.product_id";

        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            
            while (rs.next()) {
                String category = rs.getString("category");
                
                // Створюємо правильний поліморфний об'єкт залежно від категорії
                switch (category) {
                    case "Guitars":
                        Guitars g = new Guitars();
                        populateBaseFields(rs, g);
                        g.setType(rs.getString("g_type"));
                        g.setNeckMaterial(rs.getString("neckMaterial"));
                        g.setBodyMaterial(rs.getString("g_body"));
                        g.setNumberOfFrets(rs.getInt("numberOfFrets"));
                        g.setNumberOfStrings(rs.getInt("numberOfStrings"));
                        g.setPickupType(rs.getString("pickupType"));
                        products.add(g);
                        break;
                        
                    case "Keyboards":
                        Keyboards k = new Keyboards();
                        populateBaseFields(rs, k);
                        k.setType(rs.getString("k_type"));
                        k.setPolyphony(rs.getInt("polyphony"));
                        k.setNumberOfKeys(rs.getInt("numberOfKeys"));
                        k.setKeySensetivity(rs.getBoolean("keySensetivity"));
                        products.add(k);
                        break;
                        
                    case "Drums":
                        Drums d = new Drums();
                        populateBaseFields(rs, d);
                        d.setType(rs.getString("d_type"));
                        d.setConfiguration(rs.getString("configuration"));
                        d.setBodyMaterial(rs.getString("d_body"));
                        products.add(d);
                        break;
                        
                    case "Winds":
                        Winds w = new Winds();
                        populateBaseFields(rs, w);
                        w.setType(rs.getString("w_type"));
                        w.setMaterial(rs.getString("material"));
                        w.setScaleRange(rs.getString("scaleRange"));
                        products.add(w);
                        break;
                        
                    default:
                        products.add(mapRowToProduct(rs));
                        break;
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка при читанні повного каталогу товарів: " + e.getMessage());
        }
        return products;
    }

    // 2. ОНОВЛЕНІЙ МЕТОД: Розумний вибір об'єкта з урахуванням його специфічної таблиці (ISA)
    public Product getProductById(int id) {
        // Спочатку дізнаємося категорію товару
        String checkCategorySql = "SELECT category FROM products WHERE product_id = ?";
        String category = "";

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(checkCategorySql)) {
            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    category = rs.getString("category");
                } else {
                    return null; // Товар взагалі не знайдено
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка при визначенні категорії: " + e.getMessage());
            return null;
        }

        // Залежно від категорії робимо LEFT JOIN з відповідною таблицею-нащадком
        String sql = "";
        switch (category) {
            case "Guitars":
                sql = "SELECT p.*, g.type AS sub_type, g.neckMaterial, g.bodyMaterial, g.numberOfFrets, g.numberOfStrings, g.pickupType " +
                      "FROM products p LEFT JOIN guitars g ON p.product_id = g.product_id WHERE p.product_id = ?";
                break;
            case "Keyboards":
                sql = "SELECT p.*, k.type AS sub_type, k.polyphony, k.numberOfKeys, k.keySensetivity " +
                      "FROM products p LEFT JOIN keyboards k ON p.product_id = k.product_id WHERE p.product_id = ?";
                break;
            case "Drums":
                sql = "SELECT p.*, d.type AS sub_type, d.configuration, d.bodyMaterial " +
                      "FROM products p LEFT JOIN drums d ON p.product_id = d.product_id WHERE p.product_id = ?";
                break;
            case "Winds":
                sql = "SELECT p.*, w.type AS sub_type, w.material, w.scaleRange " +
                      "FROM products p LEFT JOIN winds w ON p.product_id = w.product_id WHERE p.product_id = ?";
                break;
            default:
                sql = "SELECT * FROM products WHERE product_id = ?";
                break;
        }

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, id);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    // Викликаємо правильний метод мапінгу залежно від категорії
                    switch (category) {
                        case "Guitars": return mapRowToGuitars(rs);
                        case "Keyboards": return mapRowToKeyboards(rs);
                        case "Drums": return mapRowToDrums(rs);
                        case "Winds": return mapRowToWinds(rs);
                        default: return mapRowToProduct(rs);
                    }
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка при виконанні JOIN запиту: " + e.getMessage());
        }
        return null;
    }

    public List<Product> getProductsByCategory(String category) {
        List<Product> products = new ArrayList<>();
        String sql = "SELECT * FROM products WHERE category = ?";
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, category);
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    products.add(mapRowToProduct(rs));
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка при фільтрації категорій: " + e.getMessage());
        }
        return products;
    }

    // --- МЕТОДИ МАПІНГУ ДЛЯ КОЖНОГО КЛАСУ-НАЩАДКА ---

    private Product mapRowToProduct(ResultSet rs) throws SQLException {
        return new Product(
            rs.getInt("product_id"),
            rs.getString("productName"),
            rs.getString("category"),
            rs.getString("manufacturer"),
            rs.getDouble("price"),
            rs.getInt("quantity"),
            rs.getString("condition"),
            rs.getString("description"),
            rs.getDouble("rating"),
            rs.getString("photo")
        );
    }

    private Guitars mapRowToGuitars(ResultSet rs) throws SQLException {
        Guitars g = new Guitars();
        populateBaseFields(rs, g); // Заповнюємо поля батька
        g.setType(rs.getString("sub_type")); // g.type з бази
        g.setNeckMaterial(rs.getString("neckMaterial"));
        g.setBodyMaterial(rs.getString("bodyMaterial"));
        g.setNumberOfFrets(rs.getInt("numberOfFrets"));
        g.setNumberOfStrings(rs.getInt("numberOfStrings"));
        g.setPickupType(rs.getString("pickupType"));
        return g;
    }

    private Keyboards mapRowToKeyboards(ResultSet rs) throws SQLException {
        Keyboards k = new Keyboards();
        populateBaseFields(rs, k);
        k.setType(rs.getString("sub_type"));
        k.setPolyphony(rs.getInt("polyphony"));
        k.setNumberOfKeys(rs.getInt("numberOfKeys"));
        k.setKeySensetivity(rs.getBoolean("keySensetivity"));
        return k;
    }

    private Drums mapRowToDrums(ResultSet rs) throws SQLException {
        Drums d = new Drums();
        populateBaseFields(rs, d);
        d.setType(rs.getString("sub_type"));
        d.setConfiguration(rs.getString("configuration"));
        d.setBodyMaterial(rs.getString("bodyMaterial"));
        return d;
    }

    private Winds mapRowToWinds(ResultSet rs) throws SQLException {
        Winds w = new Winds();
        populateBaseFields(rs, w);
        w.setType(rs.getString("sub_type"));
        w.setMaterial(rs.getString("material"));
        w.setScaleRange(rs.getString("scaleRange"));
        return w;
    }

    // Допоміжний метод для заповнення полів базового класу Product
    private void populateBaseFields(ResultSet rs, Product p) throws SQLException {
        p.setProductId(rs.getInt("product_id"));
        p.setProductName(rs.getString("productName"));
        p.setCategory(rs.getString("category"));
        p.setManufacturer(rs.getString("manufacturer"));
        p.setPrice(rs.getDouble("price"));
        p.setQuantity(rs.getInt("quantity"));
        p.setCondition(rs.getString("condition"));
        p.setDescription(rs.getString("description"));
        p.setRating(rs.getDouble("rating"));
        p.setPhoto(rs.getString("photo"));
    }

    // 1. АНАЛІТИКА: Генерація фінансового звіту за період з групуванням за категоріями
    public models.AdminReport getSalesReport(String fromDate, String toDate) {
        List<java.util.Map<String, Object>> chartData = new ArrayList<>();
        List<java.util.Map<String, Object>> tableData = new ArrayList<>();
        int totalProducts = 0;
        int ordersToday = 0;
        double monthlyRev = 0.0;

        try (Connection conn = config.DatabaseConfig.getConnection()) {
            
            // 1. Агрегація для верхніх плашок (ВИПРАВЛЕНО: замінено поля дат на createDate)
            try (Statement stmt = conn.createStatement()) {
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM products")) { 
                    if (rs.next()) totalProducts = rs.getInt(1); 
                }
                try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM orders WHERE DATE(creationDate) = CURRENT_DATE")) { 
                    if (rs.next()) ordersToday = rs.getInt(1); 
                }
                try (ResultSet rs = stmt.executeQuery("SELECT SUM(totalPrice) FROM orders WHERE creationDate >= DATE_SUB(NOW(), INTERVAL 1 MONTH)")) { 
                    if (rs.next()) monthlyRev = rs.getDouble(1); 
                }
            }

            // 2. Запит продажів за категоріями для Chart.js (ВИПРАВЛЕНО: o.createDate замість o.orderDate)
            String chartSql = "SELECT p.category, SUM(oi.quantity * oi.unitPrice) AS total_revenue " +
                              "FROM order_items oi JOIN products p ON oi.product_id = p.product_id " +
                              "JOIN orders o ON oi.order_id = o.order_id " +
                              "WHERE o.creationDate BETWEEN ? AND ? GROUP BY p.category";
                              
            try (PreparedStatement pstmt = conn.prepareStatement(chartSql)) {
                pstmt.setString(1, fromDate + " 00:00:00");
                pstmt.setString(2, toDate + " 23:59:59");
                try (ResultSet rs = pstmt.executeQuery()) {
                    String[] colors = {"#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"};
                    int idx = 0;
                    while (rs.next()) {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        String cat = rs.getString("category");
                        // Мапимо на українську мову для гарного відображення на діаграмі
                        map.put("name", cat.equals("Guitars") ? "Гітари" : cat.equals("Keyboards") ? "Клавішні" : cat.equals("Drums") ? "Ударні" : "Духові");
                        map.put("value", rs.getDouble("total_revenue"));
                        map.put("color", colors[idx % colors.length]);
                        chartData.add(map);
                        idx++;
                    }
                }
            }

            // 3. Запит деталізації для таблиці популярних товарів (ВИПРАВЛЕНО СТОВПЕЦЬ НА creationDate)
            String tableSql = "SELECT p.product_id, p.productName, p.category, SUM(oi.quantity) AS sold, SUM(oi.quantity * oi.unitPrice) AS revenue " +
                              "FROM order_items oi " +
                              "JOIN products p ON oi.product_id = p.product_id " +
                              "JOIN orders o ON oi.order_id = o.order_id " +
                              "WHERE o.creationDate BETWEEN ? AND ? " +
                              "GROUP BY p.product_id, p.productName, p.category " +
                              "ORDER BY sold DESC";
                              
            try (PreparedStatement pstmt = conn.prepareStatement(tableSql)) {
                // Додаємо часові рамки до дат для точного порівняння типу DATETIME у MySQL
                pstmt.setString(1, fromDate + " 00:00:00");
                pstmt.setString(2, toDate + " 23:59:59");
                
                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id", rs.getInt("product_id"));
                        map.put("name", rs.getString("productName"));
                        
                        // Локалізація назви категорії для виведення в таблицю на фронтенді
                        String cat = rs.getString("category");
                        map.put("category", cat.equals("Guitars") ? "Гітари" : cat.equals("Keyboards") ? "Клавішні" : cat.equals("Drums") ? "Ударні" : "Духові");
                        
                        map.put("sold", rs.getInt("sold"));
                        map.put("revenue", rs.getDouble("revenue"));
                        tableData.add(map);
                    }
                }
            }

        } catch (SQLException e) {
            System.err.println("Помилка генерації аналітичного звіту СУБД: " + e.getMessage());
        }
        return new models.AdminReport(totalProducts, ordersToday, monthlyRev, chartData, tableData);
    }

    // 2. ОПЕРАЦІЯ ISA: Каскадне додавання товару через Транзакцію (Транзакційність)
    public boolean insertProductWithISA(models.Product p, java.util.Map<String, Object> specificFields, String subTable) {
        String baseSql = "INSERT INTO products (productName, category, manufacturer, price, quantity, `condition`, description, rating, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        Connection conn = null;
        try {
            conn = config.DatabaseConfig.getConnection();
            conn.setAutoCommit(false); // Вмикаємо режим ручного контролю транзакцій

            int generatedProductId = 0;
            try (PreparedStatement pstmt = conn.prepareStatement(baseSql, Statement.RETURN_GENERATED_KEYS)) {
                pstmt.setString(1, p.getProductName());
                pstmt.setString(2, p.getCategory());
                pstmt.setString(3, p.getManufacturer());
                pstmt.setDouble(4, p.getPrice());
                pstmt.setInt(5, p.getQuantity());
                pstmt.setString(6, p.getCondition());
                pstmt.setString(7, p.getDescription());
                pstmt.setDouble(8, 0.0); // Початковий рейтинг нової позиції
                pstmt.setString(9, p.getPhoto() != null ? p.getPhoto() : "img/no-photo.png");

                pstmt.executeUpdate();
                try (ResultSet rs = pstmt.getGeneratedKeys()) {
                    if (rs.next()) generatedProductId = rs.getInt(1);
                }
            }

            // Формуємо динамічний другий інсерт в дочірню таблицю з отриманим PK
            if (generatedProductId > 0 && !specificFields.isEmpty()) {
                StringBuilder specSql = new StringBuilder("INSERT INTO " + subTable + " (product_id");
                StringBuilder values = new StringBuilder(" VALUES (?");
                
                for (String key : specificFields.keySet()) {
                    specSql.append(", ").append(key);
                    values.append(", ?");
                }
                specSql.append(")").append(values).append(")");

                try (PreparedStatement pstmt = conn.prepareStatement(specSql.toString())) {
                    pstmt.setInt(1, generatedProductId);
                    int paramIdx = 2;
                    for (Object val : specificFields.values()) {
                        if (val instanceof Integer) pstmt.setInt(paramIdx, (Integer) val);
                        else if (val instanceof Double) pstmt.setDouble(paramIdx, (Double) val);
                        else if (val instanceof Boolean) pstmt.setBoolean(paramIdx, (Boolean) val);
                        else pstmt.setString(paramIdx, val.toString());
                        paramIdx++;
                    }
                    pstmt.executeUpdate();
                }
            }

            conn.commit(); // Завершуємо транзакцію успішно
            return true;
        } catch (SQLException e) {
            System.err.println("Помилка транзакції ISA! Відкат змін... " + e.getMessage());
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

    // 3. ОПЕРАЦІЯ ISA: Каскадне оновлення інформації про товар через Транзакцію
    public boolean updateProductWithISA(models.Product p, java.util.Map<String, Object> specificFields, String subTable) {
        String baseSql = "UPDATE products SET productName = ?, manufacturer = ?, price = ?, quantity = ?, `condition` = ?, description = ? WHERE product_id = ?";
        Connection conn = null;
        try {
            conn = config.DatabaseConfig.getConnection();
            conn.setAutoCommit(false); // Вмикаємо транзакційність

            // 1. Оновлюємо базову таблицю
            try (PreparedStatement pstmt = conn.prepareStatement(baseSql)) {
                pstmt.setString(1, p.getProductName());
                pstmt.setString(2, p.getManufacturer());
                pstmt.setDouble(3, p.getPrice());
                pstmt.setInt(4, p.getQuantity());
                pstmt.setString(5, p.getCondition());
                pstmt.setString(6, p.getDescription());
                pstmt.setInt(7, p.getProductId());
                pstmt.executeUpdate();
            }

            // 2. Оновлюємо таблицю специфікацій (динамічно генеруємо UPDATE)
            if (!specificFields.isEmpty()) {
                StringBuilder specSql = new StringBuilder("UPDATE " + subTable + " SET ");
                java.util.Iterator<String> keyIterator = specificFields.keySet().iterator();
                while (keyIterator.hasNext()) {
                    specSql.append(keyIterator.next()).append(" = ?");
                    if (keyIterator.hasNext()) specSql.append(", ");
                }
                specSql.append(" WHERE product_id = ?");

                try (PreparedStatement pstmt = conn.prepareStatement(specSql.toString())) {
                    int paramIdx = 1;
                    for (Object val : specificFields.values()) {
                        if (val instanceof Integer) pstmt.setInt(paramIdx, (Integer) val);
                        else if (val instanceof Double) pstmt.setDouble(paramIdx, (Double) val);
                        else if (val instanceof Boolean) pstmt.setBoolean(paramIdx, (Boolean) val);
                        else pstmt.setString(paramIdx, val.toString());
                        paramIdx++;
                    }
                    pstmt.setInt(paramIdx, p.getProductId()); // Підставляємо ID для WHERE
                    pstmt.executeUpdate();
                }
            }

            conn.commit(); // Зберігаємо зміни каскадно
            return true;
        } catch (SQLException e) {
            System.err.println("Помилка модифікації товару! Відкат... " + e.getMessage());
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

    // 4. ОПЕРАЦІЯ CRUD (Delete): Просте видалення товару з каскадним очищенням у MySQL
    public boolean deleteProduct(int id) {
        String sql = "DELETE FROM products WHERE product_id = ?";
        try (Connection conn = config.DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, id);
            return pstmt.executeUpdate() > 0;
        } catch (SQLException e) {
            System.err.println("Помилка видалення товару: " + e.getMessage());
        }
        return false;
    }

    // --- УСКЛАДНЕНИЙ МЕТОД: ПОРІВНЯЛЬНИЙ АНАЛІЗ МІСЯЦЬ ДО МІСЯЦЯ ---
    public List<java.util.Map<String, Object>> getCategoryMonthlyReport(int month, int year) {
        List<java.util.Map<String, Object>> reportData = new ArrayList<>();
        
        // Визначаємо попередній місяць та рік для порівняння
        int prevMonth = month - 1;
        int prevYear = year;
        if (prevMonth == 0) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        // Складний SQL-запит з умовними агрегаціями CASE WHEN для порівняння двох періодів
        String sql = "SELECT p.category, " +
                     "SUM(CASE WHEN MONTH(o.creationDate) = ? AND YEAR(o.creationDate) = ? THEN oi.quantity ELSE 0 END) AS cur_qty, " +
                     "SUM(CASE WHEN MONTH(o.creationDate) = ? AND YEAR(o.creationDate) = ? THEN oi.quantity * oi.unitPrice ELSE 0.00 END) AS cur_rev, " +
                     "SUM(CASE WHEN MONTH(o.creationDate) = ? AND YEAR(o.creationDate) = ? THEN oi.quantity * oi.unitPrice ELSE 0.00 END) AS prev_rev " +
                     "FROM order_items oi " +
                     "JOIN products p ON oi.product_id = p.product_id " +
                     "JOIN orders o ON oi.order_id = o.order_id " +
                     "WHERE (MONTH(o.creationDate) = ? AND YEAR(o.creationDate) = ?) OR (MONTH(o.creationDate) = ? AND YEAR(o.creationDate) = ?) " +
                     "GROUP BY p.category";

        try (Connection conn = config.DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            // Заповнюємо параметри для CASE WHEN
            pstmt.setInt(1, month);      pstmt.setInt(2, year);      // Поточний для кількості
            pstmt.setInt(3, month);      pstmt.setInt(4, year);      // Поточний для виручки
            pstmt.setInt(5, prevMonth);  pstmt.setInt(6, prevYear);  // Попередній для виручки
            
            // Заповнюємо параметри для WHERE фільтрації
            pstmt.setInt(7, month);      pstmt.setInt(8, year);
            pstmt.setInt(9, prevMonth);  pstmt.setInt(10, prevYear);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> row = new java.util.HashMap<>();
                    String cat = rs.getString("category");
                    String ukrName = cat.equals("Guitars") ? "Гітари" : cat.equals("Keyboards") ? "Клавішні" : cat.equals("Drums") ? "Ударні" : "Духові";
                    
                    double curRev = rs.getDouble("cur_rev");
                    double prevRev = rs.getDouble("prev_rev");
                    
                    // Обчислюємо динаміку у відсотках порівняно з минулим місяцем
                    double growthPct = 0.0;
                    if (prevRev > 0) {
                        growthPct = ((curRev - prevRev) / prevRev) * 100.0;
                    }

                    row.put("category", ukrName);
                    row.put("totalQuantity", rs.getInt("cur_qty"));
                    row.put("totalRevenue", curRev);
                    row.put("prevRevenue", prevRev);
                    row.put("growth", Math.round(growthPct * 10.0) / 10.0); // Округлення до 1 знака
                    
                    reportData.add(row);
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка генерації ускладненого звіту: " + e.getMessage());
        }
        return reportData;
    }


    // 5. ЗВІТ КРИТИЧНИХ ЗАЛИШКІВ: Вибірка товарів, кількість яких менша або рівна мінімуму
    public List<models.Product> getLowStockReport(int criticalLimit) {
        List<models.Product> lowStockProducts = new ArrayList<>();
        String sql = "SELECT product_id, productName, category, manufacturer, price, quantity, `condition` " +
                     "FROM products " +
                     "WHERE quantity <= ? " +
                     "ORDER BY quantity ASC"; // Спочатку виводимо ті, де взагалі 0

        try (Connection conn = config.DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setInt(1, criticalLimit);
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    models.Product p = new models.Product();
                    p.setProductId(rs.getInt("product_id"));
                    p.setProductName(rs.getString("productName"));
                    p.setCategory(rs.getString("category"));
                    p.setManufacturer(rs.getString("manufacturer"));
                    p.setPrice(rs.getDouble("price"));
                    p.setQuantity(rs.getInt("quantity"));
                    p.setCondition(rs.getString("condition"));
                    
                    lowStockProducts.add(p);
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка генерації звіту залишків на складі: " + e.getMessage());
        }
        return lowStockProducts;
    }

    // 6. ЗВІТ ПОПУЛЯРНОСТІ: Топ товарів за період від лідерів до найменш популярних
    public List<java.util.Map<String, Object>> getPopularProductsReport(String fromDate, String toDate) {
        List<java.util.Map<String, Object>> popularProducts = new ArrayList<>();
        
        String sql = "SELECT p.product_id, p.productName, p.category, p.manufacturer, " +
                     "SUM(oi.quantity) AS total_sold, SUM(oi.quantity * oi.unitPrice) AS total_revenue " +
                     "FROM order_items oi " +
                     "JOIN products p ON oi.product_id = p.product_id " +
                     "JOIN orders o ON oi.order_id = o.order_id " +
                     "WHERE o.creationDate BETWEEN ? AND ? " +
                     "GROUP BY p.product_id, p.productName, p.category, p.manufacturer " +
                     "ORDER BY total_sold DESC"; // Сортування від лідерів

        try (Connection conn = config.DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            
            pstmt.setString(1, fromDate + " 00:00:00");
            pstmt.setString(2, toDate + " 23:59:59");
            
            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> item = new java.util.HashMap<>();
                    item.put("id", rs.getInt("product_id"));
                    item.put("name", rs.getString("productName"));
                    item.put("category", rs.getString("category"));
                    item.put("manufacturer", rs.getString("manufacturer"));
                    item.put("sold", rs.getInt("total_sold"));
                    item.put("revenue", rs.getDouble("total_revenue"));
                    popularProducts.add(item);
                }
            }
        } catch (SQLException e) {
            System.err.println("Помилка генерації звіту популярності товарів: " + e.getMessage());
        }
        return popularProducts;
    }

    // --- ДОДАТИ В КЛАС ProductDAO.java (або CustomerDAO.java) ---
    // 7. ЗВІТ АКТИВНОСТІ КЛІЄНТІВ: Рейтинг покупців за кількістю замовлень та сумою витрат
    public List<java.util.Map<String, Object>> getCustomerActivityReport() {
        List<java.util.Map<String, Object>> customerReport = new ArrayList<>();
        
        String sql = "SELECT c.customer_id, c.lastName, c.firstName, c.phoneNumber, c.email, " +
                     "COUNT(DISTINCT o.order_id) AS total_orders, " +
                     "IFNULL(SUM(oi.quantity * oi.unitPrice), 0) AS total_spent " +
                     "FROM customers c " +
                     "LEFT JOIN orders o ON c.customer_id = o.customer_id " +
                     "LEFT JOIN order_items oi ON o.order_id = oi.order_id " +
                     "GROUP BY c.customer_id, c.lastName, c.firstName, c.phoneNumber, c.email " +
                     "ORDER BY total_spent DESC"; // Спочатку набільші чеки (Топ-клієнти)

        try (Connection conn = config.DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            
            while (rs.next()) {
                java.util.Map<String, Object> row = new java.util.HashMap<>();
                row.put("id", rs.getInt("customer_id"));
                row.put("lastName", rs.getString("lastName"));
                row.put("firstName", rs.getString("firstName"));
                row.put("phone", rs.getString("phoneNumber"));
                row.put("email", rs.getString("email"));
                row.put("ordersCount", rs.getInt("total_orders"));
                row.put("totalSpent", rs.getDouble("total_spent"));
                customerReport.add(row);
            }
        } catch (SQLException e) {
            System.err.println("Помилка генерації звіту активності клієнтів: " + e.getMessage());
        }
        return customerReport;
    }
}