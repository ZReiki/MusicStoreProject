// Функція отримання кошика з пам'яті браузера
function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Функція збереження кошика у пам'ять
function saveCartItems(items) {
    localStorage.setItem('cart', JSON.stringify(items));
}

// Головна функція рендерингу елементів
function renderCart() {
    const items = getCartItems();
    const emptyState = document.getElementById("emptyCartState");
    const mainContent = document.getElementById("mainCartContent");
    const listContainer = document.getElementById("cartItemsList");

    // Текстове схиляння для кількості товарів в шапці (як у Figma)
    let countText = `${items.length} товарів`;
    if (items.length === 1) countText = "1 товар";
    else if (items.length > 1 && items.length < 5) countText = `${items.length} товари`;
    document.getElementById("cartCountHeader").textContent = countText;

    // Перемикання станів екрану "Порожньо / Є товари"
    if (items.length === 0) {
        emptyState.classList.remove("hidden");
        mainContent.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    mainContent.classList.remove("hidden");

    // Обчислення загальних сум
    let totalSum = 0;

    // Словник перекладу категорій для картки в кошику
    const CATEGORY_MAP = {
        "Guitars": "Гітари",
        "Keyboards": "Клавішні",
        "Drums": "Ударні",
        "Winds": "Духові"
    };
    
    listContainer.innerHTML = items.map(item => {
        const price = parseFloat(item.product.price);
        const itemTotal = price * item.quantity;
        totalSum += itemTotal;

        // ВИПРАВЛЕНО БАГ 2: Шлях до фото беремо напряму, як у каталозі, або використовуємо заглушку
        const imagePath = item.product.photo || 'https://via.placeholder.com/500';

        // ВИПРАВЛЕНО БАГ 1 та 3: Використовуємо системний productId ( camelCase з Java бекенду)
        const pId = item.product.productId;

        return `
        <li class="p-4 sm:p-6 flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center group">
            <div class="col-span-6 flex items-center gap-4 w-full">
                <a href="product.html?id=${pId}" class="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    <img src="${imagePath}" alt="${item.product.productName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                </a>
                <div class="flex flex-col flex-1">
                    <span class="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">
                        ${CATEGORY_MAP[item.product.category] || item.product.category}
                    </span>
                    <a href="product.html?id=${pId}" class="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 leading-tight">${item.product.productName}</a>
                    <span class="text-gray-500 text-sm mt-1">${price.toLocaleString('uk-UA')} ₴ / шт.</span>
                </div>
            </div>

            <div class="col-span-3 flex items-center justify-between sm:justify-center w-full sm:w-auto mt-4 sm:mt-0 border sm:border-0 border-gray-200 rounded-lg p-1 sm:p-0">
                <span class="sm:hidden text-gray-500 text-sm font-medium px-3">Кількість:</span>
                <div class="flex items-center gap-1 bg-gray-100/80 rounded-lg p-1">
                    <button onclick="updateQuantity(${pId}, ${item.quantity - 1})" class="w-8 h-8 flex items-center justify-center bg-white rounded-md text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all cursor-pointer">
                        <i data-lucide="minus" class="w-4 h-4"></i>
                    </button>
                    <span class="w-8 text-center font-bold text-gray-900">${item.quantity}</span>
                    <button onclick="updateQuantity(${pId}, ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center bg-white rounded-md text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all cursor-pointer">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div class="col-span-2 text-right w-full sm:w-auto flex justify-between sm:block">
                <span class="sm:hidden text-gray-500 text-sm font-medium">Сума:</span>
                <span class="font-bold text-lg text-gray-900">${itemTotal.toLocaleString('uk-UA')} ₴</span>
            </div>

            <div class="col-span-1 flex justify-end sm:justify-center w-full sm:w-auto">
                <button onclick="removeFromCart(${pId})" class="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center cursor-pointer">
                    <i data-lucide="trash2" class="w-5 h-5 sm:mr-0 mr-2"></i> <span class="sm:hidden">Видалити</span>
                </button>
            </div>
        </li>
        `;
    }).join('');

    // Оновлення полів чека справа
    document.getElementById("summaryCountLabel").textContent = `Товари (${items.length})`;
    document.getElementById("summaryItemsTotal").textContent = `${totalSum.toLocaleString('uk-UA')} ₴`;
    document.getElementById("cartTotalSum").textContent = `${totalSum.toLocaleString('uk-UA')} ₴`;

    // Оновлюємо бейдж у глобальній шапці, якщо така функція підключена
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }

    // Перемальовуємо нові іконки Lucide
    lucide.createIcons();
}

// Зміна кількості інструментів у кошику
function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    let items = getCartItems();
    const item = items.find(i => i.product.productId === productId);
    if (item) {
        item.quantity = newQuantity;
        saveCartItems(items);
        renderCart();
    }
}

// Видалення товару
function removeFromCart(productId) {
    let items = getCartItems();
    // Назва інструменту для гарного відображення в Toast
    const itemToRemove = items.find(i => i.product.productId === productId);
    const pName = itemToRemove ? itemToRemove.product.productName : "Інструмент";

    items = items.filter(i => i.product.productId !== productId);
    saveCartItems(items);
    renderCart();

    // Замінено нативний alert на гарний кастомний Toast
    if (typeof showToast === 'function') {
        showToast(`"${pName}" видалено з кошика`, 'info');
    }
}

// Повне очищення кошика
function clearCart() {
    localStorage.removeItem('cart');
    renderCart();
    
    if (typeof showToast === 'function') {
        showToast("Кошик повністю очищено", "info");
    }
}

// Обробка натискання кнопки "Оформити замовлення"
// Оновлена асинхронна функція оформлення замовлення через Java СУБД
async function handleCheckout() {
    const items = getCartItems();
    if (items.length === 0) return;

    // Перевіряємо, чи авторизований користувач
    const userJson = localStorage.getItem("authUser");
    if (!userJson) {
        if (typeof showToast === 'function') {
            showToast("Для оформлення замовлення необхідно увійти до свого акаунту!", "warning");
        }
        setTimeout(() => window.location.href = 'login.html', 1500);
        return;
    }

    const user = JSON.parse(userJson);
    const totalSum = items.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);

    // Кнопка лоадера для UX
    const checkoutBtn = document.querySelector("button[onclick='handleCheckout()']");
    const originalContent = checkoutBtn.innerHTML;
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add("opacity-70");
    checkoutBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';

    // Формуємо пакет даних для транзакційного масового додавання
    const payload = {
        customerId: parseInt(user.id),
        totalPrice: totalSum,
        items: items.map(item => ({
            productId: parseInt(item.product.productId),
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.product.price)
        }))
    };

    try {
        const response = await fetch('http://localhost:8080/api/user/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Помилка транзакції бази даних");
        const data = await response.json();

        if (data.status === "success") {
            if (typeof showToast === 'function') {
                showToast(`Замовлення на суму ${totalSum.toLocaleString('uk-UA')} ₴ успішно внесено до СУБД!`, 'success', 4000);
            }
            
            // Після успіху в СУБД очищуємо кошик
            localStorage.removeItem('cart');
            
            // Через 1.5 секунди перенаправляємо покупця в його особистий кабінет до вкладки замовлень
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        } else {
            if (typeof showToast === 'function') showToast("Помилка: " + data.message, "error");
        }
    } catch (error) {
        console.error("Помилка оформлення:", error);
        if (typeof showToast === 'function') showToast("Не вдалося надіслати чек на сервер Java!", "error");
    } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove("opacity-70");
        checkoutBtn.innerHTML = originalContent;
    }
}

// Первинна ініціалізація сторінки
renderCart();