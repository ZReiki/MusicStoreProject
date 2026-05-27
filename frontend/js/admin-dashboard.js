// Отримання посилань на основні елементи сторінки
const adminDashboardView = document.getElementById("adminDashboardView");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// Ініціалізація адміністративної панелі після завантаження сторінки
document.addEventListener("DOMContentLoaded", function() {
    const adminJson = localStorage.getItem("adminAuthUser");
    
    // Перевірка наявності авторизованого користувача
    if (!adminJson) {
        window.location.href = "login.html";
        return;
    }

    // Отримання даних адміністратора з localStorage
    const admin = JSON.parse(adminJson);

    // Відображення панелі адміністратора
    adminDashboardView.classList.remove("hidden");
    
    // Формування локалізованої назви ролі користувача
    const localizedRole = admin.role === "Admin"
        ? "Адміністратор системи"
        : "Старший менеджер";

    // Відображення інформації про користувача
    document.getElementById("adminWelcomeText").textContent =
        `Вітаємо, ${admin.name} | Посада: ${localizedRole}`;

    // Завантаження статистики для дашборду
    fetchDashboardCounters();

    // Ініціалізація іконок Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Отримання статистичних даних для панелі адміністратора
async function fetchDashboardCounters() {
    try {
        // Запит даних з бекенду
        const response = await fetch(
            'http://localhost:8080/api/admin/report?from=2026-01-01&to=2026-12-31'
        );

        if (!response.ok) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }
        
        const data = await response.json();

        // Оновлення статистичних показників на сторінці
        document.getElementById("statTotalProducts").textContent =
            `${data.totalProductsInDB.toLocaleString('uk-UA')} шт.`;

        document.getElementById("statOrdersToday").textContent =
            `${data.totalOrdersToday} заявок`;

        document.getElementById("statMonthlyRevenue").textContent =
            `${data.monthlyRevenue.toLocaleString('uk-UA')} ₴`;

    } catch (error) {
        console.error("Помилка завантаження лічильників дашборду:", error);
        
        // Встановлення значень за замовчуванням у разі помилки
        document.getElementById("statTotalProducts").textContent = "0 шт.";
        document.getElementById("statOrdersToday").textContent = "0 заявок";
        document.getElementById("statMonthlyRevenue").textContent = "0 ₴";
    }
}

// Обробка виходу користувача з системи
adminLogoutBtn.addEventListener("click", function() {
    // Видалення даних авторизації
    localStorage.removeItem("adminAuthUser");

    // Перенаправлення на сторінку входу
    window.location.href = "login.html";
});