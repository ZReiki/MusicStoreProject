// Отримання товарів кошика з localStorage
function getCartItems() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Збереження товарів кошика у localStorage
function saveCartItems(items) {
    localStorage.setItem('cart', JSON.stringify(items));
}

// Відображення вмісту кошика на сторінці
function renderCart() {
    const items = getCartItems();

    const emptyState = document.getElementById("emptyCartState");
    const mainContent = document.getElementById("mainCartContent");
    const listContainer = document.getElementById("cartItemsList");

    // Формування тексту кількості товарів
    let countText = `${items.length} товарів`;

    if (items.length === 1) {
        countText = "1 товар";
    } else if (items.length > 1 && items.length < 5) {
        countText = `${items.length} товари`;
    }

    document.getElementById("cartCountHeader").textContent = countText;

    // Перевірка стану кошика
    if (items.length === 0) {
        emptyState.classList.remove("hidden");
        mainContent.classList.add("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    mainContent.classList.remove("hidden");

    // Змінна для підрахунку загальної суми замовлення
    let totalSum = 0;

    // Локалізація назв категорій товарів
    const CATEGORY_MAP = {
        "Guitars": "Гітари",
        "Keyboards": "Клавішні",
        "Drums": "Ударні",
        "Winds": "Духові"
    };
    
    // Формування HTML-розмітки товарів кошика
    listContainer.innerHTML = items.map(item => {
        const price = parseFloat(item.product.price);
        const itemTotal = price * item.quantity;

        totalSum += itemTotal;

        // Отримання шляху до зображення товару
        const imagePath = item.product.photo || 'https://via.placeholder.com/500';

        // Отримання ідентифікатора товару
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

                    <a href="product.html?id=${pId}" class="font-bold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 leading-tight">
                        ${item.product.productName}
                    </a>

                    <span class="text-gray-500 text-sm mt-1">
                        ${price.toLocaleString('uk-UA')} ₴ / шт.
                    </span>
                </div>
            </div>

            <div class="col-span-3 flex items-center justify-between sm:justify-center w-full sm:w-auto mt-4 sm:mt-0 border sm:border-0 border-gray-200 rounded-lg p-1 sm:p-0">
                <span class="sm:hidden text-gray-500 text-sm font-medium">
                    Кількість:
                </span>

                <div class="flex items-center gap-1 bg-gray-100/80 rounded-lg p-1">
                    <button onclick="updateQuantity(${pId}, ${item.quantity - 1})" class="w-8 h-8 flex items-center justify-center bg-white rounded-md text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all cursor-pointer">
                        <i data-lucide="minus" class="w-4 h-4"></i>
                    </button>

                    <span class="w-8 text-center font-bold text-gray-900">
                        ${item.quantity}
                    </span>

                    <button onclick="updateQuantity(${pId}, ${item.quantity + 1})" class="w-8 h-8 flex items-center justify-center bg-white rounded-md text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all cursor-pointer">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <div class="col-span-2 text-right w-full sm:w-auto flex justify-between sm:block">
                <span class="sm:hidden text-gray-500 text-sm font-medium">
                    Сума:
                </span>

                <span class="font-bold text-lg text-gray-900">
                    ${itemTotal.toLocaleString('uk-UA')} ₴
                </span>
            </div>

            <div class="col-span-1 flex justify-end sm:justify-center w-full sm:w-auto">
                <button onclick="removeFromCart(${pId})" class="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center cursor-pointer">
                    <i data-lucide="trash2" class="w-5 h-5 sm:mr-0 mr-2"></i>
                    <span class="sm:hidden">Видалити</span>
                </button>
            </div>
        </li>
        `;
    }).join('');

    // Оновлення інформації про підсумок замовлення
    document.getElementById("summaryCountLabel").textContent =
        `Товари (${items.length})`;

    document.getElementById("summaryItemsTotal").textContent =
        `${totalSum.toLocaleString('uk-UA')} ₴`;

    document.getElementById("cartTotalSum").textContent =
        `${totalSum.toLocaleString('uk-UA')} ₴`;

    // Оновлення бейджа кошика у шапці сайту
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }

    // Ініціалізація іконок Lucide
    lucide.createIcons();
}

// Оновлення кількості товару у кошику
function updateQuantity(productId, newQuantity) {
    let items = getCartItems();

    const item = items.find(i => i.product.productId === productId);
    
    if (!item) return;

    // Видалення товару при кількості менше або рівній нулю
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    // Перевірка доступної кількості товару на складі
    if (
        item.product.quantity !== undefined &&
        newQuantity > item.product.quantity
    ) {
        if (typeof showToast === 'function') {
            showToast(
                `Немає такої кількості на складі! Максимально доступно для замовлення: ${item.product.quantity} шт.`,
                "warning"
            );
        }

        return;
    }

    // Оновлення кількості товару
    item.quantity = newQuantity;

    saveCartItems(items);
    renderCart();
}

// Видалення товару з кошика
function removeFromCart(productId) {
    let items = getCartItems();

    // Отримання назви товару для повідомлення
    const itemToRemove = items.find(i => i.product.productId === productId);

    const pName = itemToRemove
        ? itemToRemove.product.productName
        : "Інструмент";

    // Видалення товару зі списку
    items = items.filter(i => i.product.productId !== productId);

    saveCartItems(items);
    renderCart();

    // Відображення повідомлення про видалення
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

// Оформлення замовлення
async function handleCheckout() {
    const items = getCartItems();

    if (items.length === 0) return;

    const userJson = localStorage.getItem("authUser");

    // Перевірка авторизації користувача
    if (!userJson) {
        if (typeof showToast === 'function') {
            showToast(
                "Для оформлення замовлення необхідно увійти до свого акаунту!",
                "warning"
            );
        }

        setTimeout(() => window.location.href = 'login.html', 1500);

        return;
    }

    const user = JSON.parse(userJson);

    // Обчислення загальної суми замовлення
    const totalSum = items.reduce(
        (sum, item) =>
            sum + (parseFloat(item.product.price) * item.quantity),
        0
    );

    // Блокування кнопки оформлення під час запиту
    const checkoutBtn = document.querySelector(
        "button[onclick='handleCheckout()']"
    );

    const originalContent = checkoutBtn.innerHTML;

    checkoutBtn.disabled = true;
    checkoutBtn.classList.add("opacity-70");

    checkoutBtn.innerHTML =
        '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';

    // Формування об'єкта замовлення
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
        // Надсилання замовлення на сервер
        const response = await fetch(
            'http://localhost:8080/api/user/checkout',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            throw new Error("Помилка транзакції бази даних");
        }

        const data = await response.json();

        if (data.status === "success") {

            // Відображення повідомлення про успішне оформлення
            if (typeof showToast === 'function') {
                showToast(
                    `Замовлення на суму ${totalSum.toLocaleString('uk-UA')} ₴ успішно внесено до СУБД! Складські залишки оновлено.`,
                    'success',
                    4000
                );
            }
            
            // Очищення кошика після успішного оформлення
            localStorage.removeItem('cart');
            
            // Перехід до профілю користувача
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);

        } else {

            // Відображення повідомлення про помилку
            if (typeof showToast === 'function') {
                showToast(data.message, "error", 6000);
            }
        }

    } catch (error) {
        console.error("Помилка оформлення:", error);

        // Відображення повідомлення про помилку з'єднання
        if (typeof showToast === 'function') {
            showToast(
                "Не вдалося надіслати чек на сервер Java!",
                "error"
            );
        }

    } finally {

        // Відновлення стану кнопки оформлення
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove("opacity-70");
        checkoutBtn.innerHTML = originalContent;
    }
}

// Ініціалізація сторінки кошика
renderCart();