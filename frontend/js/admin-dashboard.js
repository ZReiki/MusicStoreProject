// Посилання на елементи
const adminDashboardView = document.getElementById("adminDashboardView");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// Перевірка безпеки та первинне завантаження даних системи при старті сторінки
document.addEventListener("DOMContentLoaded", function() {
    const adminJson = localStorage.getItem("adminAuthUser");
    
    if (!adminJson) {
        // Якщо співробітник не авторизований - примусово відправляємо на сторінку входу
        window.location.href = "login.html";
        return;
    }

    // Якщо авторизований - заповнюємо персональні дані і показуємо панель
    const admin = JSON.parse(adminJson);
    adminDashboardView.classList.remove("hidden");
    
    // Динамічно підставляємо ПІБ та посаду (Admin/Manager) з активної сесії
    const localizedRole = admin.role === "Admin" ? "Адміністратор системи" : "Старший менеджер";
    document.getElementById("adminWelcomeText").textContent = `Вітаємо, ${admin.name} | Посада: ${localizedRole}`;

    // Завантажуємо динамічні лічильники агрегацій з СУБД
    fetchDashboardCounters();

    // Ініціалізуємо іконки Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// Функція запиту агрегованих лічильників з Java бекенду
async function fetchDashboardCounters() {
    try {
        // Викликаємо сервер, передаючи поточні дати за замовчуванням (для лічильників верхньої панелі)
        const response = await fetch('http://localhost:8080/api/admin/report?from=2026-01-01&to=2026-12-31');
        if (!response.ok) throw new Error(`HTTP помилка: ${response.status}`);
        
        const data = await response.json();

        // Оновлюємо текстовий контент елементів реальними даними з MySQL
        document.getElementById("statTotalProducts").textContent = `${data.totalProductsInDB.toLocaleString('uk-UA')} шт.`;
        document.getElementById("statOrdersToday").textContent = `${data.totalOrdersToday} заявок`;
        document.getElementById("statMonthlyRevenue").textContent = `${data.monthlyRevenue.toLocaleString('uk-UA')} ₴`;

    } catch (error) {
        console.error("Помилка завантаження лічильників дашборду:", error);
        
        // У разі помилки виставляємо нулі, щоб інтерфейс не зависав на стадії завантаження
        document.getElementById("statTotalProducts").textContent = "0 шт.";
        document.getElementById("statOrdersToday").textContent = "0 заявок";
        document.getElementById("statMonthlyRevenue").textContent = "0 ₴";
    }
}

// Обробка натискання кнопки "Вийти"
adminLogoutBtn.addEventListener("click", function() {
    localStorage.removeItem("adminAuthUser");
    window.location.href = "login.html";
});