package dao;

import com.google.gson.Gson;

import models.Customer;
import models.Employee;
import models.Product;

import java.util.ArrayList;
import java.util.List;

public class Controller {
    private ProductDAO productDAO = new ProductDAO();
    private UserDAO userDAO = new UserDAO();
    private Gson gson = new Gson();

    // Повертає весь каталог (як і було)
    public String getProductAsJson(){
        List<Product> products = productDAO.getAllProducts();
        return gson.toJson(products);
    }

    // НОВИЙ МЕТОД: Перетворює один знайдений товар в JSON рядок
    public String getProductByIdAsJson(int id) {
        Product product = productDAO.getProductById(id);
        if (product == null) {
            return "{\"error\": \"Product not found\"}";
        }
        return gson.toJson(product);
    }

    // НОВИЙ МЕТОД: Перетворює відфільтровані категорії в JSON
    public String getProductsByCategoryAsJson(String category) {
        List<Product> products = productDAO.getProductsByCategory(category);
        return gson.toJson(products);
    }

    // НОВИЙ МЕТОД: Вхід у систему (Перевірка ролей та пошук в БД)
    public String handleLogin(String email) {
        // Перевіряємо, чи це співробітник системи (Адмін або Менеджер)
        if (email.endsWith("@musicstore.ua")) {
            Employee employee = userDAO.getEmployeeByLogin(email);
            if (employee != null) {
                // Додаємо віртуальне поле типу ролі, щоб фронтенд знав, куди перенаправляти
                return String.format("{\"status\":\"success\", \"type\":\"employee\", \"role\":\"%s\", \"user\":%s}", 
                        employee.getPosition(), gson.toJson(employee));
            }
        }
        
        // Якщо не співробітник, шукаємо серед клієнтів (customers)
        Customer customer = userDAO.getCustomerByEmail(email);
        if (customer != null) {
            return String.format("{\"status\":\"success\", \"type\":\"customer\", \"user\":%s}", gson.toJson(customer));
        }

        // Якщо нікого не знайшли
        return "{\"status\":\"error\", \"message\":\"User not found\"}";
    }

    public String handleRegister(String jsonCustomer) {
        try {
            Customer newCustomer = gson.fromJson(jsonCustomer, Customer.class);
            
            // ВИПРАВЛЕНО БАГ 4: Серверне блокування реєстрації на корпоративний домен
            if (newCustomer.getEmail() != null && newCustomer.getEmail().endsWith("@musicstore.ua")) {
                return "{\"status\":\"error\", \"message\":\"Registration on this domain is forbidden for customers!\"}";
            }
            
            if (userDAO.getCustomerByEmail(newCustomer.getEmail()) != null) {
                return "{\"status\":\"error\", \"message\":\"Email already exists\"}";
            }

            boolean isSaved = userDAO.registerCustomer(newCustomer);
            if (isSaved) {
                return String.format("{\"status\":\"success\", \"user\":%s}", gson.toJson(newCustomer));
            }
        } catch (Exception e) {
            return "{\"status\":\"error\", \"message\":\"Invalid data format\"}";
        }
        return "{\"status\":\"error\", \"message\":\"Registration failed\"}";
    }

    // НОВИЙ МЕТОД: Обробка запиту на оновлення профілю клієнта
    public String handleUpdateProfile(String jsonCustomer) {
        try {
            Customer updatedCustomer = gson.fromJson(jsonCustomer, Customer.class);
            boolean isUpdated = userDAO.updateCustomer(updatedCustomer);
            if (isUpdated) {
                return "{\"status\":\"success\"}";
            }
        } catch (Exception e) {
            return "{\"status\":\"error\", \"message\":\"Invalid data format\"}";
        }
        return "{\"status\":\"error\", \"message\":\"Update failed in database\"}";
    }

    public String getSalesReportAsJson(String from, String to) {
        models.AdminReport report = productDAO.getSalesReport(from, to);
        return gson.toJson(report);
    }

    public String addProductISA(String jsonRaw) {
        try {
            com.google.gson.JsonObject obj = gson.fromJson(jsonRaw, com.google.gson.JsonObject.class);
            
            // Базовий продукт
            models.Product p = new models.Product();
            p.setProductName(obj.get("productName").getAsString());
            String sysCat = obj.get("category").getAsString(); // "guitars" -> мапимо на системний "Guitars"
            p.setCategory(sysCat.substring(0, 1).toUpperCase() + sysCat.substring(1));
            p.setManufacturer(obj.get("manufacturer").getAsString());
            p.setPrice(obj.get("price").getAsDouble());
            p.setQuantity(obj.get("quantity").getAsString().isEmpty() ? 0 : obj.get("quantity").getAsInt());
            p.setCondition(obj.get("condition").getAsString());
            p.setDescription(obj.get("description").getAsString());

            // Специфічні поля підтаблиці
            java.util.Map<String, Object> specMap = new java.util.HashMap<>();
            com.google.gson.JsonObject specs = obj.getAsJsonObject("specificData");

            if (specs != null) {
                for (java.util.Map.Entry<String, com.google.gson.JsonElement> entry : specs.entrySet()) {
                    com.google.gson.JsonElement el = entry.getValue();
                    
                    // ВИПРАВЛЕНО: Перевіряємо, що елемент існує і не є JSON NULL
                    if (el != null && !el.isJsonNull()) {
                        if (el.isJsonPrimitive()) {
                            com.google.gson.JsonPrimitive primitive = el.getAsJsonPrimitive();
                            
                            // Якщо це логічний тип (Boolean)
                            if (primitive.isBoolean()) {
                                specMap.put(entry.getKey(), primitive.getAsBoolean());
                            } 
                            // Якщо це число (Int / Double)
                            else if (primitive.isNumber()) {
                                // Перевіряємо, чи є число цілим (наприклад кількість струн/ладів)
                                double numValue = primitive.getAsDouble();
                                if (numValue == Math.floor(numValue)) {
                                    specMap.put(entry.getKey(), primitive.getAsInt());
                                } else {
                                    specMap.put(entry.getKey(), numValue);
                                }
                            } 
                            // Якщо це звичайний рядок (String)
                            else if (primitive.isString()) {
                                String strVal = primitive.getAsString();
                                // Додатковий захист, якщо boolean прилетів як рядок "true"/"false"
                                if ("true".equalsIgnoreCase(strVal) || "false".equalsIgnoreCase(strVal)) {
                                    specMap.put(entry.getKey(), Boolean.parseBoolean(strVal));
                                } else {
                                    specMap.put(entry.getKey(), strVal);
                                }
                            }
                        } else {
                            // Якщо прилетів об'єкт чи масив - записуємо як рядок
                            specMap.put(entry.getKey(), el.toString());
                        }
                    }
                }
            }

            boolean success = productDAO.insertProductWithISA(p, specMap, sysCat);
            if (success) return "{\"status\":\"success\"}";
        } catch (Exception e) {
            return "{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}";
        }
        return "{\"status\":\"error\", \"message\":\"Transaction failed\"}";
    }

    public String updateProductISA(String jsonRaw) {
        try {
            com.google.gson.JsonObject obj = gson.fromJson(jsonRaw, com.google.gson.JsonObject.class);
            
            models.Product p = new models.Product();
            p.setProductId(obj.get("productId").getAsInt());
            p.setProductName(obj.get("productName").getAsString());
            p.setManufacturer(obj.get("manufacturer").getAsString());
            p.setPrice(obj.get("price").getAsDouble());
            p.setQuantity(obj.get("quantity").getAsInt());
            p.setCondition(obj.get("condition").getAsString());
            p.setDescription(obj.get("description").getAsString());

            String sysCat = obj.get("category").getAsString();
            java.util.Map<String, Object> specMap = new java.util.HashMap<>();
            com.google.gson.JsonObject specs = obj.getAsJsonObject("specificData");
            
            // Твоя логіка розбору Gson полів (яку ми виправляли минулого разу)
            if (specs != null) {
                for (java.util.Map.Entry<String, com.google.gson.JsonElement> entry : specs.entrySet()) {
                    com.google.gson.JsonElement el = entry.getValue();
                    if (el != null && !el.isJsonNull() && el.isJsonPrimitive()) {
                        com.google.gson.JsonPrimitive primitive = el.getAsJsonPrimitive();
                        if (primitive.isBoolean()) specMap.put(entry.getKey(), primitive.getAsBoolean());
                        else if (primitive.isNumber()) specMap.put(entry.getKey(), primitive.getAsInt());
                        else if (primitive.isString()) specMap.put(entry.getKey(), primitive.getAsString());
                    }
                }
            }

            boolean success = productDAO.updateProductWithISA(p, specMap, sysCat);
            if (success) return "{\"status\":\"success\"}";
        } catch (Exception e) {
            return "{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}";
        }
        return "{\"status\":\"error\", \"message\":\"Update failed\"}";
    }

    public String handleDeleteProduct(int id) {
        boolean isDeleted = productDAO.deleteProduct(id);
        if (isDeleted) {
            return "{\"status\":\"success\"}";
        }
        return "{\"status\":\"error\", \"message\":\"Не вдалося видалити товар. Можливо, він міститься в активних замовленнях чеків.\"}";
    }

    public String getCategoryMonthlyReportAsJson(int month, int year) {
        List<java.util.Map<String, Object>> report = productDAO.getCategoryMonthlyReport(month, year);
        return gson.toJson(report);
    }

    public String getLowStockReportAsJson(int limit) {
        List<models.Product> report = productDAO.getLowStockReport(limit);
        return gson.toJson(report);
    }

    public String getPopularProductsReportAsJson(String from, String to) {
        List<java.util.Map<String, Object>> report = productDAO.getPopularProductsReport(from, to);
        return gson.toJson(report);
    }

    public String getCustomerActivityReportAsJson() {
        List<java.util.Map<String, Object>> report = productDAO.getCustomerActivityReport();
        return gson.toJson(report);
    }

    public String getCustomerOrdersAsJson(int customerId) {
        return gson.toJson(userDAO.getCustomerOrders(customerId));
    }

    public String handleCartCheckout(String jsonRaw) {
        try {
            com.google.gson.JsonObject obj = gson.fromJson(jsonRaw, com.google.gson.JsonObject.class);
            int customerId = obj.get("customerId").getAsInt();
            double totalSum = obj.get("totalPrice").getAsDouble();
            
            com.google.gson.JsonArray itemsArray = obj.getAsJsonArray("items");
            List<java.util.Map<String, Object>> itemsList = new ArrayList<>();
            
            for (com.google.gson.JsonElement el : itemsArray) {
                com.google.gson.JsonObject itemObj = el.getAsJsonObject();
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("productId", itemObj.get("productId").getAsDouble());
                map.put("quantity", itemObj.get("quantity").getAsDouble());
                map.put("unitPrice", itemObj.get("unitPrice").getAsDouble());
                itemsList.add(map);
            }

            boolean success = userDAO.checkoutOrder(customerId, totalSum, itemsList);
            if (success) return "{\"status\":\"success\"}";
        } catch (Exception e) {
            return "{\"status\":\"error\", \"message\":\"" + e.getMessage() + "\"}";
        }
        return "{\"status\":\"error\", \"message\":\"Checkout transaction failed\"}";
    }
}