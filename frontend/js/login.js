let currentMode = 'login'; // 'login' або 'register'

// АВТО-РЕДІРЕКТ: Якщо користувач уже авторизований, не пускаємо його на сторінку входу заново
(function checkExistingSession() {
    if (localStorage.getItem("adminAuthUser")) {
        window.location.href = "admin-dashboard.html";
    } else if (localStorage.getItem("authUser")) {
        window.location.href = "profile.html";
    }
})();

// Функція плавного динамічного перемикання форми
function toggleFormMode(mode) {
    currentMode = mode;
    const regFields = document.getElementById("register-fields");
    const loginOptions = document.getElementById("login-options");
    const submitBtn = document.getElementById("globalAuthBtn");
    const formTitle = document.getElementById("form-title");
    const formSubtitle = document.getElementById("form-subtitle");
    const iconContainer = document.getElementById("form-icon-container");
    const formIcon = document.getElementById("form-icon");

    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");

    const inputs = regFields.querySelectorAll("input");
    
    if (mode === 'register') {
        regFields.classList.remove("hidden");
        loginOptions.classList.add("hidden");
        submitBtn.textContent = "Створити обліковий запис";
        formTitle.textContent = "Реєстрація клієнта";
        formSubtitle.textContent = "Створіть свій особистий кабінет";
        
        tabRegister.className = "flex-1 py-2.5 font-bold text-sm text-center rounded-lg bg-white text-blue-600 shadow-sm transition-all cursor-pointer";
        tabLogin.className = "flex-1 py-2.5 font-semibold text-sm text-center rounded-lg text-gray-500 hover:text-gray-900 transition-all cursor-pointer";
        
        iconContainer.className = "w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3";
        formIcon.setAttribute("data-lucide", "user-plus");

        inputs.forEach(input => input.required = true);
    } else {
        regFields.classList.add("hidden");
        loginOptions.classList.remove("hidden");
        submitBtn.textContent = "Увійти";
        formTitle.textContent = "Вхід у систему";
        formSubtitle.textContent = "Введіть ваші облікові дані";
        
        tabLogin.className = "flex-1 py-2.5 font-bold text-sm text-center rounded-lg bg-white text-blue-600 shadow-sm transition-all cursor-pointer";
        tabRegister.className = "flex-1 py-2.5 font-semibold text-sm text-center rounded-lg text-gray-500 hover:text-gray-900 transition-all cursor-pointer";
        
        iconContainer.className = "w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3";
        formIcon.setAttribute("data-lucide", "lock");

        inputs.forEach(input => input.required = false);
    }
    if (window.lucide) lucide.createIcons();
}

// Обробка відправки форми
document.getElementById("globalAuthForm").addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const btn = document.getElementById("globalAuthBtn");
    
    if (currentMode === 'register' && email.endsWith("@musicstore.ua")) {
        if (typeof showToast === 'function') {
            showToast("Реєстрація клієнтів на домен @musicstore.ua заблокована!", "error");
        }
        return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.classList.add("opacity-70");
    btn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';

    try {
        if (currentMode === 'login') {
            // --- 1. РЕЖИМ ВХОДУ ---
            const response = await fetch('http://localhost:8080/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, password: password })
            });

            if (!response.ok) throw new Error("Помилка сервера");
            const data = await response.json();

            if (data.status === "success") {
                if (data.type === "employee") {
                    localStorage.setItem("adminAuthUser", JSON.stringify({
                        name: `${data.user.lastName} ${data.user.firstName.charAt(0)}.`,
                        email: data.user.login,
                        role: data.role
                    }));
                    if (typeof showToast === 'function') showToast(`Успішний вхід! Роль: ${data.role}`, "success");
                    setTimeout(() => window.location.href = "admin-dashboard.html", 1000);
                } else {
                    localStorage.setItem("authUser", JSON.stringify({
                        id: data.user.customerId,
                        name: `${data.user.firstName} ${data.user.lastName}`,
                        email: data.user.email,
                        phone: data.user.phoneNumber,
                        address: data.user.residentialAddress || "Не вказано"
                    }));
                    if (typeof showToast === 'function') showToast("Раді бачити вас знову!", "success");
                    setTimeout(() => window.location.href = "profile.html", 1000);
                }
            } else {
                if (typeof showToast === 'function') showToast("Користувача не знайдено або дані невірні!", "error");
            }

        } else {
            // --- 2. РЕЖИМ РЕЄСТРАЦІЇ ---
            const regData = {
                lastName: document.getElementById("regLastName").value.trim(),
                firstName: document.getElementById("regFirstName").value.trim(),
                phoneNumber: document.getElementById("regPhone").value.trim(),
                email: email,
                residentialAddress: "" 
            };

            const response = await fetch('http://localhost:8080/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regData)
            });

            if (!response.ok) throw new Error("Помилка реєстрації");
            const data = await response.json();

            if (data.status === "success") {
                if (typeof showToast === 'function') {
                    showToast("Обліковий запис створено! Виконайте вхід.", "success", 4000);
                }
                
                // Скидаємо поля та перемикаємо форму в дефолтний вхід
                document.getElementById("globalAuthForm").reset();
                toggleFormMode('login');
                document.getElementById("authEmail").value = email;
            } else {
                if (typeof showToast === 'function') {
                    if (data.message === "Email already exists") {
                        showToast(`Користувач з email ${email} вже зареєстрований у системі!`, "error", 5000);
                    } else {
                        showToast(data.message || "Помилка при створенні акаунту", "error");
                    }
                }
            }
        }
    } catch (error) {
        console.error("Помилка автентифікації:", error);
        if (typeof showToast === 'function') showToast("Помилка з'єднання з сервером!", "error");
    } finally {
        btn.disabled = false;
        btn.classList.remove("opacity-70");
        // Повертаємо кнопці правильний текст залежно від поточного вікна
        btn.textContent = currentMode === 'login' ? "Увійти" : "Створити обліковий запис";
    }
});