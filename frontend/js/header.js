function renderHeader() {
    // 1. Знаходимо місце для хедера на сторінці
    const headerPlaceholder = document.getElementById("header-placeholder");
    if (!headerPlaceholder) return;

    // 2. Вставляємо HTML-код 
    headerPlaceholder.innerHTML = `
        <header class="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
                
                <div class="flex items-center gap-3 cursor-pointer flex-shrink-0" onclick="window.location.href='catalog.html'">
                    <div class="bg-blue-600 text-white font-bold w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm">M</div>
                    <span class="text-xl font-bold tracking-tight text-gray-950">Music Store</span>
                </div>

                <div class="flex-1 max-w-2xl mx-4 relative">
                    <div class="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                        <i data-lucide="search" class="w-5 h-5"></i>
                    </div>
                    <input 
                        type="text" 
                        id="globalSearchInput" 
                        class="block w-full border border-gray-200 rounded-lg py-2 pl-10 pr-4 bg-gray-50/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400" 
                        placeholder="Пошук інструментів за назвою..."
                    >
                </div>

                <div class="flex items-center gap-6 text-gray-600 flex-shrink-0">
                    <button onclick="window.location.href='cart.html'" class="hover:text-blue-600 transition-colors cursor-pointer relative" title="Кошик">
                        <i data-lucide="shopping-cart" class="w-5 h-5"></i>
                        <span id="headerCartBadge" class="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full hidden">0</span>
                    </button>
                    <button onclick="window.location.href='login.html'" class="hover:text-blue-600 transition-colors cursor-pointer" title="Профіль">
                        <i data-lucide="user" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </header>
    `;

    // 3. Ініціалізуємо іконки Lucide саме для хедера
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 4. Логіка: Оновлення бейджа кошика
    updateCartBadge();

    // 5. Логіка: Глобальний пошук
    setupGlobalSearch();
}

// Функція для оновлення кількості товарів на іконці кошика
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const badge = document.getElementById("headerCartBadge");
    
    // Рахуємо загальну кількість одиниць
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.classList.remove("hidden");
    } else {
        badge.classList.add("hidden");
    }
}

// Функція обробки пошуку
function setupGlobalSearch() {
    const searchInput = document.getElementById("globalSearchInput");
    
    // Якщо ми на сторінці каталогу, передаємо керування у catalog.js
    const isCatalogPage = window.location.pathname.includes("catalog.html") || window.location.pathname === "/";
    
    searchInput.addEventListener("keyup", function(e) {
        if (e.key === "Enter") {
            const query = searchInput.value.trim();
            if (!isCatalogPage) {
                // Якщо ми в профілі чи адмінці - перекидаємо в каталог з параметром
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            } else {
                // Якщо ми вже в каталозі - викликаємо функцію з catalog.js (якщо вона існує)
                if (typeof renderProducts === "function") {
                    searchQuery = query; // Змінна з catalog.js
                    renderProducts();
                }
            }
        }
    });
}

// Запускаємо рендер відразу при завантаженні файлу
document.addEventListener("DOMContentLoaded", renderHeader);