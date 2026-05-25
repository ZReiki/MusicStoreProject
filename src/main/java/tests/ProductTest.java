package tests;

import dao.ProductDAO;
import models.Product;
import java.util.List;

public class ProductTest {

    public static void main(String[] args) {
        System.out.println("=== ЗАПУСК АВТОМАТИЧНИХ ТЕСТІВ: ЕТАП 1 ===");
        
        testDatabaseConnection();
        testProductMapping();
        
        System.out.println("=========================================");
    }

    // 1. Тест на підключення та отримання даних
    public static void testDatabaseConnection() {
        System.out.print("Тест 1: З'єднання з БД та вибірка... ");
        ProductDAO dao = new ProductDAO();
        List<Product> products = dao.getAllProducts();

        if (products != null && !products.isEmpty()) {
            System.out.println("[ПРОЙДЕНО] (Знайдено " + products.size() + " товарів)");
        } else {
            System.out.println("[ПОМИЛКА] База порожня або з'єднання розірвано!");
        }
    }

    // 2. Тест на коректність даних (валідація об'єктів)
    public static void testProductMapping() {
        System.out.print("Тест 2: Валідація атрибутів товару... ");
        ProductDAO dao = new ProductDAO();
        List<Product> products = dao.getAllProducts();

        if (products.isEmpty()) {
            System.out.println("[СКАСОВАНО] Немає даних для перевірки.");
            return;
        }

        Product first = products.get(0);
        // Перевіряємо, чи не порожні критичні поля
        boolean isValid = first.getProductName() != null && !first.getProductName().isEmpty() 
                          && first.getPrice() >= 0;

        if (isValid) {
            System.out.println("[ПРОЙДЕНО] Дані коректні.");
        } else {
            System.out.println("[ПОМИЛКА] Знайдено некоректні атрибути (ID: " + first.getProductName() + ")");
        }
    }
}
