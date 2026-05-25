import com.sun.net.httpserver.*;
import dao.Controller;

import java.io.*;
import java.net.*;
import java.nio.charset.*;

public class Main {
    public static void main(String[] args) {
        try {
            int port = 8080;
            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            System.out.println("=== MusicStore Backend Запущено! ===");
            System.out.println("Сервер очікує запитів на http://localhost:" + port);

            server.createContext("/api/products", new ProductsHandler());
            server.createContext("/api/login", new LoginHandler());
            server.createContext("/api/register", new RegisterHandler());
            server.createContext("/api/user/update", new UpdateProfileHandler());
            server.createContext("/api/admin/report", new AdminReportHandler());
            server.createContext("/api/admin/add-product", new AddProductISAHandler());
            server.createContext("/api/admin/update-product", new UpdateProductISAHandler());
            server.createContext("/api/admin/delete-product", new DeleteProductHandler());
            server.createContext("/api/admin/category-monthly-report", new CategoryMonthlyReportHandler());
            server.createContext("/api/admin/low-stock-report", new LowStockReportHandler());
            server.createContext("/api/admin/popular-report", new PopularProductsReportHandler());
            server.createContext("/api/admin/customer-activity-report", new CustomerActivityReportHandler());
            server.createContext("/api/user/orders", new CustomerOrdersHandler());
            server.createContext("/api/user/checkout", new CartCheckoutHandler());
            server.setExecutor(null);
            server.start();
        } catch (IOException e) {
            System.err.println("Не вдалося запустити сервер: " + e.getMessage());
        }
    }

    static class ProductsHandler implements HttpHandler {
    private final Controller controller = new Controller();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

        if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            // Отримуємо повний URI запиту, наприклад: /api/products?id=3 або /api/products?category=Guitars
            URI requestURI = exchange.getRequestURI();
            String query = requestURI.getQuery(); // Отримаємо чистий рядок параметрів: "id=3"
            
            String jsonResponse = "";

            if (query != null) {
                // Розбираємо параметри (дуже проста логіка для швидкості)
                if (query.startsWith("id=")) {
                    try {
                        int id = Integer.parseInt(query.substring(3)); // Вирізаємо цифру після "id="
                        jsonResponse = controller.getProductByIdAsJson(id); // Отримуємо ОДИН об'єкт
                    } catch (NumberFormatException e) {
                        exchange.sendResponseHeaders(400, -1); // Помилка невірного формату ID
                        return;
                    }
                } 
                else if (query.startsWith("category=")) {
                    String category = query.substring(9); // Вирізаємо назву категорії
                    // Декодуємо категорію, якщо вона написана кирилицею (наприклад, %20 замінює на пробіл)
                    category = URLDecoder.decode(category, StandardCharsets.UTF_8.name());
                    jsonResponse = controller.getProductsByCategoryAsJson(category);
                }
            } else {
                // Якщо параметрів немає (просто /api/products) — віддаємо весь каталог
                jsonResponse = controller.getProductAsJson();
            }

            byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, bytes.length);

            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
            System.out.println("[GET] Оброблено запит з параметрами: " + (query != null ? query : "Всі товари"));
        } else {
            exchange.sendResponseHeaders(405, -1);
        }
        }
    }

    // ХЕНДЛЕР ДЛЯ ВХОДУ (POST /api/login)
    static class LoginHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                String body = sb.toString();
                String email = body.replaceAll(".*\"email\":\"([^\"]+)\".*", "$1");

                String jsonResponse = controller.handleLogin(email);

                // ВИПРАВЛЕНО БАГ 3: Логування в консоль сервера
                System.out.println("\n[POST] Запит на авторизацію користувача:");
                System.out.println("-> Спроба входу з Email/Login: " + email);
                if (jsonResponse.contains("success")) {
                    System.out.println("-> Результат: УСПІШНО АВТЕНТИФІКОВАНО");
                } else {
                    System.out.println("-> Результат: ВІДМОВА (Користувача не знайдено)");
                }

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР ДЛЯ РЕЄСТРАЦІЇ (POST /api/register)
    static class RegisterHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                String rawBody = sb.toString();
                String jsonResponse = controller.handleRegister(rawBody);

                // ВИПРАВЛЕНО БАГ 3: Логування реєстрації клієнтів
                System.out.println("\n[POST] Запит на створення нового акаунту (Реєстрація):");
                System.out.println("-> Отримано JSON: " + rawBody);
                if (jsonResponse.contains("success")) {
                    System.out.println("-> Результат: Клієнта успішно внесено до таблиці 'customers'");
                } else {
                    System.out.println("-> Результат: ПОМИЛКА (Пошта зайнята або заблокований домен)");
                }

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР ДЛЯ ОНОВЛЕННЯ ДАНИХ КЛІЄНТА (PUT /api/user/update)
    static class UpdateProfileHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            // Дозволяємо HTTP метод PUT для оновлення ресурсів REST API
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "PUT, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                String rawBody = sb.toString();
                String jsonResponse = controller.handleUpdateProfile(rawBody);

                // Логування в консоль сервера
                System.out.println("\n[PUT] Запит на редагування особистих даних клієнта:");
                System.out.println("-> Оновлений об'єкт: " + rawBody);
                System.out.println("-> Результат: Запис успішно модифіковано в таблиці 'customers'");

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // 1. ХЕНДЛЕР ДЛЯ АНАЛІТИЧНИХ ЗВІТІВ АДМІНІСТРАТОРА (GET /api/admin/report?from=X&to=Y)
    static class AdminReportHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                URI requestURI = exchange.getRequestURI();
                String query = requestURI.getQuery(); // Отримуємо параметри "from=2026-01-01&to=2026-12-31"
                
                String fromDate = "2026-01-01";
                String toDate = "2026-12-31";

                // Парсимо параметри дати з URI
                if (query != null) {
                    String[] params = query.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length == 2) {
                            if (pair[0].equals("from")) fromDate = pair[1];
                            if (pair[0].equals("to")) toDate = pair[1];
                        }
                    }
                }

                // Викликаємо аналітичний метод контролера
                String jsonResponse = controller.getSalesReportAsJson(fromDate, toDate);

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // 2. ХЕНДЛЕР ДЛЯ КАСКАДНОГО ДОДАВАННЯ ТОВАРУ ЗА СХЕМОЮ ISA (POST /api/admin/add-product)
    static class AddProductISAHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                String rawBody = sb.toString();
                // Викликаємо метод транзакційного збереження
                String jsonResponse = controller.addProductISA(rawBody);

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    static class UpdateProductISAHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "PUT, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("PUT".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                String jsonResponse = controller.updateProductISA(sb.toString());
                
                System.out.println("\n[PUT] Запит на каскадне редагування товару за схемою ISA");

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР ДЛЯ ВИДАЛЕННЯ ТОВАРУ (DELETE /api/admin/delete-product?id=X)
    static class DeleteProductHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "DELETE, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("DELETE".equalsIgnoreCase(exchange.getRequestMethod())) {
                URI requestURI = exchange.getRequestURI();
                String query = requestURI.getQuery();
                int id = 0;

                if (query != null && query.startsWith("id=")) {
                    try {
                        id = Integer.parseInt(query.substring(3));
                    } catch (NumberFormatException e) {
                        exchange.sendResponseHeaders(400, -1);
                        return;
                    }
                }

                String jsonResponse = controller.handleDeleteProduct(id);
                System.out.println("[DELETE] Запит на видалення інструменту з ID: " + id);

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР: GET /api/admin/category-monthly-report?month=5&year=2026
    static class CategoryMonthlyReportHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                URI requestURI = exchange.getRequestURI();
                String query = requestURI.getQuery();
                
                // Дефолтні значення поточного згідно курсової моменту
                int month = 5; 
                int year = 2026;

                if (query != null) {
                    String[] params = query.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length == 2) {
                            if (pair[0].equals("month")) month = Integer.parseInt(pair[1]);
                            if (pair[0].equals("year")) year = Integer.parseInt(pair[1]);
                        }
                    }
                }

                String jsonResponse = controller.getCategoryMonthlyReportAsJson(month, year);

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР: GET /api/admin/low-stock-report?limit=5
    static class LowStockReportHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                URI requestURI = exchange.getRequestURI();
                String query = requestURI.getQuery();
                int limit = 5; // Дефолтний мінімум за замовчуванням

                if (query != null && query.startsWith("limit=")) {
                    try {
                        limit = Integer.parseInt(query.substring(6));
                    } catch (NumberFormatException e) {
                        System.err.println("Помилка парсингу ліміту залишків");
                    }
                }

                String jsonResponse = controller.getLowStockReportAsJson(limit);
                System.out.println("[GET] Запит на формування звіту критичних залишків на складі (Ліміт: <= " + limit + ")");

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР: GET /api/admin/popular-report?from=X&to=Y
    static class PopularProductsReportHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                URI requestURI = exchange.getRequestURI();
                String query = requestURI.getQuery();
                
                String fromDate = "2026-01-01";
                String toDate = "2026-12-31";

                if (query != null) {
                    String[] params = query.split("&");
                    for (String param : params) {
                        String[] pair = param.split("=");
                        if (pair.length == 2) {
                            if (pair[0].equals("from")) fromDate = pair[1];
                            if (pair[0].equals("to")) toDate = pair[1];
                        }
                    }
                }

                String jsonResponse = controller.getPopularProductsReportAsJson(fromDate, toDate);
                System.out.println("[GET] Формування звіту «Найпопулярніші товари» за період з " + fromDate + " по " + toDate);

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР: GET /api/admin/customer-activity-report
    static class CustomerActivityReportHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                String jsonResponse = controller.getCustomerActivityReportAsJson();
                System.out.println("[GET] Формування аналітичного звіту «Активність клієнтів»");

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР: GET /api/user/orders?customerId=X
    static class CustomerOrdersHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                URI requestURI = exchange.getRequestURI();
                String query = requestURI.getQuery();
                int customerId = 0;

                if (query != null && query.startsWith("customerId=")) {
                    try {
                        customerId = Integer.parseInt(query.substring(11));
                    } catch (NumberFormatException e) {
                        exchange.sendResponseHeaders(400, -1);
                        return;
                    }
                }

                String jsonResponse = controller.getCustomerOrdersAsJson(customerId);
                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }

    // ХЕНДЛЕР: POST /api/user/checkout
    static class CartCheckoutHandler implements HttpHandler {
        private final Controller controller = new Controller();

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
            exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                String jsonResponse = controller.handleCartCheckout(sb.toString());
                System.out.println("[POST] Запит на транзакційне оформлення чека з кошика клієнта");

                byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
                exchange.sendResponseHeaders(200, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } else {
                exchange.sendResponseHeaders(405, -1);
            }
        }
    }
}