let productFromDB = [];

// Фільтри та стан каталогу
let searchQuery = "";
let selectedCategories = [];
let selectedBrands = [];
let selectedCondition = "Всі";
let minPrice = 0;
let maxPrice = 50000;
let selectedSpecs = {};

// DOM елементи
const productGrid = document.getElementById("productGrid");
const productCount = document.getElementById("productCount");
const emptyState = document.getElementById("emptyState");
const priceMinInput = document.getElementById("priceMin");
const priceMaxInput = document.getElementById("priceMax");
const priceRangeInput = document.getElementById("priceRange");
const dynamicSpecsContainer = document.getElementById("dynamicSpecificationsContainer");
const specificationsFields = document.getElementById("specificationsFields");

/**
 * Завантажує товари з API, обчислює динамічні межі цін 
 * та ініціалізує UI компонентів фільтрації.
 */
async function fetchProducts() {
    try {
        const response = await fetch('http://localhost:8080/api/products');

        if (!response.ok) {
            throw new Error(`HTTP помилка: ${response.status}`);
        }

        productFromDB = await response.json();

        // Динамічне вирахування максимальної ціни на основі отриманих даних
        if (productFromDB.length > 0) {
            const maxPriceInDB = Math.max(...productFromDB.map(p => p.price));

            maxPrice = maxPriceInDB > 0 ? maxPriceInDB : 50000;

            priceMaxInput.value = maxPrice;
            priceRangeInput.max = maxPrice;
            priceRangeInput.value = maxPrice;
        }

        initStaticFiltersUI();
        updateBrandFilterUI();
        renderProducts(productFromDB);

    } catch (error) {
        console.error("Помилка заватнаження товарів з бази даних:", error);

        document.getElementById("productGrid").innerHTML = `
            <div class="col-span-full text-center py-10 text-red-500 font-medium">
                Помилка з'єднання з сервером. Переконайтесь, що Java Backend запущено.
            </div>
        `;

        showToast("Помилка завантаження товарів з бази даних!", "error");
    }
}

// Константи конфігурації інтерфейсу
const CATEGORY_MAP = {
    "Guitars": "Гітари",
    "Keyboards": "Клавішні",
    "Drums": "Ударні",
    "Winds": "Духові"
};
const CATEGORIES = ["Guitars", "Keyboards", "Drums", "Winds"];
const CONDITIONS = ["Всі", "New", "Used"];

/**
 * Формує унікальний список брендів, які є в наявності серед товарів,
 * та рендерить відповідні чекбокси.
 */
function updateBrandFilterUI() {
    const uniqueBrandsInDB = [...new Set(productFromDB.map(p => p.manufacturer).filter(Boolean))].sort();
    
    const container = document.getElementById("brandsContainer");
    if (uniqueBrandsInDB.length === 0) {
        container.innerHTML = `<span class="text-xs text-gray-400 italic">Немає доступних брендів</span>`;
        return;
    }

    container.innerHTML = uniqueBrandsInDB.map(brand => `
        <label class="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" value="${brand}" ${selectedBrands.includes(brand) ? 'checked' : ''} class="brand-chkbx w-4 h-4 text-blue-600 rounded border-gray-300">
            <span class="text-gray-700 group-hover:text-blue-600 transition-colors">${brand}</span>
        </label>
    `).join('');
}

/**
 * Генерує блоки фільтрів під специфічні характеристики категорії.
 * Відображається лише тоді, коли обрано рівно одну категорію.
 */
function updateDynamicSpecificationsUI() {
    // Якщо обрано 0 або більше ніж 1 категорію одночасно — ховаємо додаткові специфікації
    if (selectedCategories.length !== 1) {
        dynamicSpecsContainer.classList.add("hidden");
        specificationsFields.innerHTML = "";
        selectedSpecs = {}; 
        return;
    }

    const currentCategory = selectedCategories[0];
    
    // Фільтруємо товари суто цієї категорії, щоб витягнути з них унікальні характеристики
    const categoryProducts = productFromDB.filter(p => p.category === currentCategory);
    
    // Визначаємо, які поля шукати залежно від обраної категорії (співставлено з атрибутами сутностей у БД)
    let specFieldsConfig = [];
    
    if (currentCategory === "Guitars") {
        specFieldsConfig = [
            { id: "type", label: "Тип гітари" },
            { id: "bodyMaterial", label: "Матеріал корпусу" },
            { id: "neckMaterial", label: "Матеріал грифа" },
            { id: "numberOfFrets", label: "Кількість ладів" },
            { id: "numberOfStrings", label: "Кількість струн" },
            { id: "pickupType", label: "Тип звукознімачів" }
        ];
    } else if (currentCategory === "Keyboards") {
        specFieldsConfig = [
            { id: "type", label: "Тип" },
            { id: "numberOfKeys", label: "Кількість клавіш" },
            { id: "polyphony", label: "Поліфонія (голосів)" },
            { id: "keySensetivity", label: "Чутливість клавіш" }
        ];
    } else if (currentCategory === "Drums") {
        specFieldsConfig = [
            { id: "type", label: "Тип" },
            { id: "bodyMaterial", label: "Матеріал корпусу" }
        ];
    } else if (currentCategory === "Winds") {
        specFieldsConfig = [
            { id: "type", label: "Тип" },
            { id: "material", label: "Матеріал" },
            { id: "scaleRange", label: "Діапазон октав" }
        ];
    }

    let htmlResult = "";

    // Генерація HTML для характеристик
    specFieldsConfig.forEach(field => {
        // Збираємо значення, приводимо до String
        const uniqueValues = [...new Set(categoryProducts.map(p => p[field.id]).filter(v => v !== undefined && v !== null && v !== ''))]
            .map(String)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        // Відображаємо фільтр, тільки якщо для нього знайшли хоча б одне значення у товарах
        if (uniqueValues.length > 0) {
            htmlResult += `
                <div>
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">${field.label}</h3>
                    <div class="space-y-2 max-h-32 overflow-y-auto pr-1">
            `;
            
            uniqueValues.forEach(val => {
                // Спеціальний висновок для логічного поля BOOLEAN (keySensetivity)
                let displayVal = val;
                if (field.id === "keySensetivity") {
                    displayVal = (val === "true" || val === "1") ? "Є чутливість" : "Немає чутливості";
                }

                const isChecked = selectedSpecs[field.id] && selectedSpecs[field.id].includes(val);
                
                htmlResult += `
                    <label class="flex items-center gap-2.5 text-sm cursor-pointer group">
                        <input type="checkbox" data-spec-id="${field.id}" value="${val}" ${isChecked ? 'checked' : ''} class="spec-chkbx w-3.5 h-3.5 text-blue-600 rounded border-gray-300">
                        <span class="text-gray-600 group-hover:text-blue-600 transition-colors">${displayVal}</span>
                    </label>
                `;
            });
            
            htmlResult += `
                    </div>
                </div>
            `;
        }
    });

    if (htmlResult !== "") {
        specificationsFields.innerHTML = htmlResult;
        dynamicSpecsContainer.classList.remove("hidden");
    } else {
        dynamicSpecsContainer.classList.add("hidden");
    }
}

// --- РЕНДЕР КАРТОК ТОВАРІВ І МАТРИЦЯ ФІЛЬТРАЦІЇ ---
function renderProducts(sourceArray = productFromDB) {
    const filtered = sourceArray.filter(product => {
        const pName = product.productName ? product.productName.toLowerCase() : "";
        const pBrand = product.manufacturer ? product.manufacturer.toLowerCase() : "";
        const pCondition = product.condition || "New";

        const matchesSearch = pName.includes(searchQuery.toLowerCase()) || pBrand.includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.category);
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(product.manufacturer);
        const matchesCondition = selectedCondition === "Всі" || pCondition === selectedCondition;
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;

        // Валідація додаткових динамічних характеристик (AND між різними групами, OR всередині групи)
        let matchesSpecs = true;
        for (const specKey in selectedSpecs) {
            if (selectedSpecs[specKey] && selectedSpecs[specKey].length > 0) {
                const productValue = String(product[specKey]);
                if (!selectedSpecs[specKey].includes(productValue)) {
                    matchesSpecs = false;
                    break;
                }
            }
        }

        return matchesSearch && matchesCategory && matchesBrand && matchesCondition && matchesPrice && matchesSpecs;
    });

    productCount.textContent = `Знайдено: ${filtered.length}`;

    if (filtered.length === 0) {
        productGrid.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    
    productGrid.innerHTML = filtered.map(product => {
        const currentRating = product.rating || 0;
        let starsHTML = "";
        for (let i = 0; i < 5; i++) {
            starsHTML += `<i data-lucide="star" class="w-4 h-4 ${i < Math.round(currentRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}"></i>`;
        }

        const conditionBadge = product.condition === 'Used' ? 'Вживаний' : 'Новий';
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const isInCart = cart.some(item => item.product.productId === product.productId);

        // Перевіряємо, чи зайшов під цим браузером адмін або менеджер
        const isAdmin = localStorage.getItem("adminAuthUser") !== null;

        let buttonHTML = '';
    
        // Перевірка на наявність
        if (product.quantity <= 0) {
            // Якщо товару 0, виводимо сіру заблоковану кнопку (disabled)
            buttonHTML = `
                <button disabled class="bg-gray-200 text-gray-400 px-4 py-2 rounded-lg font-medium text-sm transition-colors cursor-not-allowed flex items-center gap-1">
                    <i data-lucide="package-x" class="w-4 h-4"></i> Закінчився
                </button>
            `;
        } else {
            // Якщо товар є — відпрацьовує стандартний вибір "До кошика" / "В кошику"
            if (isInCart) {
                buttonHTML = `
                    <button onclick="event.stopPropagation(); window.location.href='cart.html'" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors outline-none cursor-pointer flex items-center gap-1">
                        <i data-lucide="check" class="w-4 h-4"></i> В кошику
                    </button>
                `;
            } else {
                buttonHTML = `
                    <button onclick="event.stopPropagation(); addToCartFromUI(${product.productId})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors outline-none active:scale-95 cursor-pointer">
                        До кошика
                    </button>
                `;
            }
        }

        let editButtonHTML = '';
        if (isAdmin) {
            editButtonHTML = `
                <div class="flex items-center gap-1">
                    <button onclick="event.stopPropagation(); window.location.href='admin-add-product.html?id=${product.productId}'" 
                            class="p-2 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-200 transition-colors cursor-pointer" 
                            title="Редагувати інструмент в БД">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteProductFromCatalog(${product.productId}, '${product.productName.replace(/'/g, "\\'")}')" 
                            class="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors cursor-pointer" 
                            title="Видалити інструмент з MySQL">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
        }

        return `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer group hover:-translate-y-1">
                <div class="aspect-[4/3] bg-gray-50 relative overflow-hidden" onclick="window.location.href='product.html?id=${product.productId}'">
                    <img src="${product.photo || 'img/no-photo.png'}" 
                        alt="${product.productName}" 
                        class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500 ${product.quantity <= 0 ? 'opacity-40 grayscale' : ''}">
                    <div class="absolute top-3 left-3">
                        <span class="px-2.5 py-1 bg-white/95 backdrop-blur-sm text-xs font-semibold text-gray-700 rounded-md border border-gray-100/50">${conditionBadge}</span>
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col" onclick="window.location.href='product.html?id=${product.productId}'">
                    <span class="text-[11px] text-blue-600 font-bold tracking-wider uppercase bg-blue-50 px-2 py-0.5 rounded-sm w-fit">
                        ${CATEGORY_MAP[product.category] || product.category}
                    </span>
                    <h3 class="text-lg font-bold text-gray-900 mt-2 line-clamp-1 group-hover:text-blue-700 transition-colors">${product.productName}</h3>
                    <div class="flex items-center gap-1 mb-4 mt-2">${starsHTML} <span class="text-xs font-medium text-gray-500 ml-1">(${Number(currentRating).toFixed(1)})</span></div>
                    <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                        <div class="font-bold text-xl text-gray-900">${Number(product.price).toLocaleString('uk-UA')} ₴</div>
                        <div class="flex items-center gap-2">
                            ${editButtonHTML}
                            ${buttonHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// --- ГЕНЕРАЦІЯ СТАТИЧНИХ ЕЛЕМЕНТІВ ---
function initStaticFiltersUI() {
    document.getElementById("categoriesContainer").innerHTML = CATEGORIES.map(cat => `
        <label class="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" value="${cat}" ${selectedCategories.includes(cat) ? 'checked' : ''} class="category-chkbx w-4 h-4 text-blue-600 rounded border-gray-300">
            <span class="text-gray-700 group-hover:text-blue-600 transition-colors">${CATEGORY_MAP[cat] || cat}</span>
        </label>
    `).join('');

    document.getElementById("conditionsContainer").innerHTML = CONDITIONS.map(cond => {
        // Мапінг для відображення в інтерфейсі сидбару
        let labelText = cond === 'Всі' ? 'Всі' : (cond === 'New' ? 'Новий' : 'Вживаний');
        return `
            <label class="flex items-center gap-3 cursor-pointer group">
                <input type="radio" name="condition" value="${cond}" ${cond === selectedCondition ? 'checked' : ''} class="condition-radio w-4 h-4 text-blue-600">
                <span class="text-gray-700 group-hover:text-blue-600 transition-colors">${labelText}</span>
            </label>
        `;
    }).join('');
}

// --- НАЛАШТУВАННЯ СЛУХАЧІВ ПОДІЙ ---
function setupEventListeners() {
    // Зміна категорії -> перераховуємо бренди та специфікації
    document.getElementById("categoriesContainer").addEventListener("change", () => {
        selectedCategories = Array.from(document.querySelectorAll(".category-chkbx:checked")).map(el => el.value);
        selectedSpecs = {}; // скидаємо старі підфільтри
        updateDynamicSpecificationsUI();
        renderProducts();
    });

    // Зміна брендів
    document.getElementById("brandsContainer").addEventListener("change", () => {
        selectedBrands = Array.from(document.querySelectorAll(".brand-chkbx:checked")).map(el => el.value);
        renderProducts();
    });

    // Зміна стану
    document.getElementById("conditionsContainer").addEventListener("change", (e) => {
        selectedCondition = e.target.value;
        renderProducts();
    });

    // Повзунки ціни
    priceMinInput.addEventListener("input", (e) => { minPrice = Number(e.target.value); renderProducts(); });
    priceMaxInput.addEventListener("input", (e) => { 
        maxPrice = Number(e.target.value); 
        priceRangeInput.value = maxPrice;
        renderProducts(); 
    });
    priceRangeInput.addEventListener("input", (e) => {
        maxPrice = Number(e.target.value);
        priceMaxInput.value = maxPrice;
        renderProducts();
    });

    // Слухач подій для кліків на динамічні специфікації категорії
    specificationsFields.addEventListener("change", (e) => {
        if (e.target.classList.contains("spec-chkbx")) {
            const specId = e.target.getAttribute("data-spec-id");
            const value = e.target.value;

            if (!selectedSpecs[specId]) {
                selectedSpecs[specId] = [];
            }

            if (e.target.checked) {
                selectedSpecs[specId].push(value);
            } else {
                selectedSpecs[specId] = selectedSpecs[specId].filter(v => v !== value);
                if (selectedSpecs[specId].length === 0) {
                    delete selectedSpecs[specId];
                }
            }
            renderProducts();
        }
    });

    // Глобальний пошук з шапки
    const checkSearchInputInterval = setInterval(() => {
        const globalSearch = document.getElementById("globalSearchInput");
        if (globalSearch) {
            clearInterval(checkSearchInputInterval);
            if (searchQuery) globalSearch.value = searchQuery;
            globalSearch.addEventListener("input", (e) => {
                searchQuery = e.target.value;
                renderProducts();
            });
        }
    }, 100);

    // Скидання фільтрів
    document.getElementById("resetFiltersBtn").addEventListener("click", () => {
        searchQuery = ""; 
        const globalSearch = document.getElementById("globalSearchInput");
        if (globalSearch) globalSearch.value = ""; 
        
        selectedCategories = []; 
        selectedBrands = [];
        selectedCondition = "Всі";
        selectedSpecs = {};
        minPrice = 0; 
        priceMinInput.value = 0;
        
        const maxPriceInDB = productFromDB.length > 0 ? Math.max(...productFromDB.map(p => p.price)) : 100000;
        maxPrice = maxPriceInDB; 
        priceMaxInput.value = maxPrice; 
        priceRangeInput.max = maxPrice;
        priceRangeInput.value = maxPrice;
        
        dynamicSpecsContainer.classList.add("hidden");
        specificationsFields.innerHTML = "";

        initStaticFiltersUI();
        updateBrandFilterUI();
        renderProducts();
    });
}

// --- ДОДАВАННЯ В КОШИК ---
function addToCartFromUI(productId) {
    const productToAdd = productFromDB.find(p => p.productId === productId);
    if (!productToAdd) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.product.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ product: productToAdd, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    if (typeof updateCartBadge === 'function') updateCartBadge();
    
    renderProducts();
    showToast(`Інструмент "${productToAdd.productName}" успішно додано до кошика!`, 'success');
}

async function deleteProductFromCatalog(productId, productName) {
    if (!confirm(`Ви дійсно хочете видалити інструмент "${productName}" з бази даних? \nСпрацює ON DELETE CASCADE для його характеристик.`)) {
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/admin/delete-product?id=${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error("Помилка при видаленні на сервері");
        const data = await response.json();

        if (data.status === "success" || data.message === undefined) {
            showToast(`"${productName}" успішно видалено!`, "success");
            
            // Замість перезавантаження сторінки просто оновлюємо масив у пам'яті фронтенду
            productFromDB = productFromDB.filter(p => p.productId !== productId);
            
            // Перемальовуємо динамічні фільтри та сітку товарів
            updateBrandFilterUI();
            updateDynamicSpecificationsUI();
            renderProducts();
        } else {
            showToast("Помилка СУБД RESTRICT: " + data.message, "error");
        }
    } catch (error) {
        console.error("Помилка:", error);
        showToast("Не вдалося виконати видалення (можливо, товар є в активному замовленні)!", "error");
    }
}

// Старт
setupEventListeners();
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('search')) searchQuery = urlParams.get('search');

fetchProducts();