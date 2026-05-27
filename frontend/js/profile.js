let currentUser = null;

// Перевірка сесії при завантаженні сторінки
document.addEventListener("DOMContentLoaded", function() {
    const userJson = localStorage.getItem("authUser");
    
    if (!userJson) {
        window.location.href = "login.html";
        return;
    }

    currentUser = JSON.parse(userJson);
    document.getElementById("profileContent").classList.remove("hidden");
    
    // Ініціалізація даних у кабінеті
    fillProfileFields();
    if (window.lucide) lucide.createIcons();
});

// Функція заповнення полей форми даними з LocalStorage
function fillProfileFields() {
    if (!currentUser) return;

    document.getElementById("userEmailTop").textContent = currentUser.email;
    document.getElementById("userInitial").textContent = currentUser.name.charAt(0).toUpperCase();
    document.getElementById("userNameTop").textContent = currentUser.name;

    // Розділяємо ім'я та прізвище для інпутів форми
    const nameParts = currentUser.name.split(" ");
    document.getElementById("profileFirstName").value = nameParts[0] || "";
    document.getElementById("profileLastName").value = nameParts[1] || "";
    
    document.getElementById("profileEmail").value = currentUser.email;
    document.getElementById("profilePhone").value = currentUser.phone || "";
    document.getElementById("profileAddress").value = currentUser.address === "Не вказано" ? "" : currentUser.address;
}

function switchProfileTab(tabId) {
    document.querySelectorAll(".profile-tab-content").forEach(el => el.classList.add("hidden"));
    document.querySelectorAll(".profile-tab-btn").forEach(btn => {
        btn.className = "profile-tab-btn flex items-center gap-3 px-6 py-4 text-sm font-medium border-l-4 border-transparent text-gray-600 hover:bg-gray-50 transition-all w-full text-left cursor-pointer";
    });

    document.getElementById(`profileTab-${tabId}`).classList.remove("hidden");
    document.getElementById(`tabBtn-${tabId}`).className = "profile-tab-btn flex items-center gap-3 px-6 py-4 text-sm font-medium border-l-4 border-blue-600 bg-blue-50 text-blue-600 transition-all w-full text-left cursor-pointer";
    
    if (tabId === 'orders') {
        loadCustomerOrdersHistory();
    }

    if (window.lucide) lucide.createIcons();
}

// Обробка відправки форми редагування профілю (Зв'язок із Java API)
document.getElementById("profileUpdateForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const btn = document.getElementById("saveProfileBtn");
    const originalText = btn.textContent;
    
    btn.disabled = true;
    btn.classList.add("opacity-70");
    btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';

    const updatedData = {
        customerId: currentUser.id, // Потрібно для WHERE customer_id = ?
        firstName: document.getElementById("profileFirstName").value.trim(),
        lastName: document.getElementById("profileLastName").value.trim(),
        phoneNumber: document.getElementById("profilePhone").value.trim(),
        email: currentUser.email, // Email незмінний PK/Unique
        residentialAddress: document.getElementById("profileAddress").value.trim()
    };

    try {
        const response = await fetch('http://localhost:8080/api/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (!response.ok) throw new Error("Помилка при оновленні");
        const data = await response.json();

        if (data.status === "success") {
            // Оновлюємо локальну сесію браузера новими даними
            currentUser.name = `${updatedData.firstName} ${updatedData.lastName}`;
            currentUser.phone = updatedData.phoneNumber;
            currentUser.address = updatedData.residentialAddress || "Не вказано";
            localStorage.setItem("authUser", JSON.stringify(currentUser));

            // Перемальовуємо шапку кабінету
            document.getElementById("userNameTop").textContent = currentUser.name;
            document.getElementById("userInitial").textContent = currentUser.name.charAt(0).toUpperCase();

            if (typeof showToast === 'function') {
                showToast("Особисті дані успішно збережено в базі СУБД!", "success");
            }
        } else {
            if (typeof showToast === 'function') showToast(data.message || "Не вдалося оновити дані", "error");
        }
    } catch (error) {
        console.error("Помилка запиту:", error);
        if (typeof showToast === 'function') showToast("Помилка з'єднання з сервером!", "error");
    } finally {
        btn.disabled = false;
        btn.classList.remove("opacity-70");
        btn.textContent = originalText;
    }
});

// Функція завантаження історії чеків покупця з Java-сервера
async function loadCustomerOrdersHistory() {
    if (!currentUser || !currentUser.id) return;

    const container = document.getElementById("ordersContentWrapper");

    try {
        const response = await fetch(`http://localhost:8080/api/user/orders?customerId=${currentUser.id}`);
        if (!response.ok) throw new Error("Помилка завантаження чеків");
        const orders = await response.json();

        // Якщо в базі MySQL немає жодного чека для цього customer_id
        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <i data-lucide="package" class="w-12 h-12 text-gray-300 mx-auto mb-4"></i>
                    <h4 class="text-lg font-medium text-gray-900 mb-2">У вас поки немає замовлень</h4>
                    <p class="text-gray-500 mb-6 max-w-sm mx-auto">Список порожній. Зробіть свою першу покупку в нашому магазині.</p>
                    <a href="catalog.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm">
                        Перейти до каталогу
                    </a>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Якщо замовлення знайдені, малюємо чисту, красиву реляційну таблицю
        let htmlTable = `
            <div class="overflow-x-auto rounded-xl border border-gray-100">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th class="py-3.5 px-4 text-center">Номер чеку</th>
                            <th class="py-3.5 px-4">Дата оформлення</th>
                            <th class="py-3.5 px-4 text-center">Товарів</th>
                            <th class="py-3.5 px-4 text-right">Сума</th>
                            <th class="py-3.5 px-4 class='text-center'">Статус</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100 text-sm">
        `;

        orders.forEach(order => {
            const formattedId = order.orderId.toString().padStart(6, '0');
            
            // Форматування красивих статусів
            let statusClass = "bg-gray-100 text-gray-700";
            let statusText = order.orderStatus;
            
            if (order.orderStatus === "Completed") {
                statusClass = "bg-green-50 text-green-700 border-green-200";
                statusText = "Виконано";
            } else if (order.orderStatus === "Pending") {
                statusClass = "bg-orange-50 text-orange-700 border-orange-200";
                statusText = "В обробці";
            }

            // Відсікаємо мілісекунди від дати DATETIME з MySQL для гарного відображення
            const cleanDate = order.creationDate ? order.creationDate.substring(0, 16).replace('T', ' ') : '—';

            htmlTable += `
                <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="py-4 px-4 text-center font-mono text-xs font-bold text-gray-400">#${formattedId}</td>
                    <td class="py-4 px-4 text-gray-600 font-medium">${cleanDate}</td>
                    <td class="py-4 px-4 text-center font-bold text-gray-500">${order.totalItems} шт.</td>
                    <td class="py-4 px-4 text-right font-black text-gray-900">${order.totalPrice.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-4 px-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-1 text-xs font-bold border rounded-lg whitespace-nowrap ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        });

        htmlTable += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = htmlTable;

    } catch (error) {
        console.error("Помилка завантаження історії чеків:", error);
        container.innerHTML = `<p class="text-center py-8 text-red-500 font-medium">Не вдалося завантажити історію замовлень з сервера.</p>`;
    }
}

function handleLogout() {
    localStorage.removeItem("authUser");
    window.location.href = "login.html";
}