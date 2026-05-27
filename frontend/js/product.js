// Назви технічних характеристик українською (узгоджено з атрибутами таблиць MySQL)
const SPEC_LABELS = {
    type: 'Тип інструменту',
    bodyMaterial: 'Матеріал корпусу',
    neckMaterial: 'Матеріал грифа',
    numberOfFrets: 'Кількість ладів',
    numberOfStrings: 'Кількість струн',
    pickupType: 'Тип звукознімачів',
    numberOfKeys: 'Кількість клавіш',
    keySensetivity: 'Чутливість до натискання',
    polyphony: 'Поліфонія (голосів)',
    configuration: 'Конфігурація/Комплектація',
    material: 'Матеріал покриття',
    scaleRange: 'Діапазон октав'
};

// Словники для мапінгу системних назв із БД на українську мову
const CATEGORY_MAP = {
    "Guitars": "Гітари",
    "Keyboards": "Клавішні",
    "Drums": "Ударні",
    "Winds": "Духові"
};

const CONDITION_MAP = {
    "New": "Новий",
    "Used": "Вживаний"
};

// Змінна для збереження поточного товару, який прийде з бекенду
let product = null;
let currentActiveTab = 'description';

// 1. Визначаємо ID з URL-параметра (?id=X)
const urlParams = new URLSearchParams(window.location.search);
const productId = parseInt(urlParams.get('id')) || 1;

// Головна функція завантаження даних із Java-сервера
function loadProductData() {
    fetch(`http://localhost:8080/api/products?id=${productId}`)
        .then(response => {
            if (!response.ok) throw new Error('Товар не знайдено');
            return response.json();
        })
        .then(data => {
            if(data.error) {
                showErrorState();
            } else {
                product = data;
                initProductDetails();
            }
        })
        .catch(error => {
            console.error('Помилка завантаження:', error);
            showErrorState();
        });
}

function showErrorState() {
    document.body.innerHTML = `
        <div class="py-20 text-center">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Інструмент з ID ${productId} не знайдено в базі даних</h2>
            <a href="catalog.html" class="text-blue-600 hover:underline font-medium">Повернутися до каталогу</a>
        </div>`;
}

// Функція первинного рендеру сторінки
function initProductDetails() {
    if (!product) return;

    // Локалізація назви категорії
    const ukrCategory = CATEGORY_MAP[product.category] || product.category;

    document.getElementById("breadcrumbs").innerHTML = `
        <li><a href="catalog.html" class="hover:text-blue-600 transition-colors">Головна</a></li>
        <li><i data-lucide="chevron-right" class="w-4 h-4"></i></li>
        <li><a href="catalog.html" class="hover:text-blue-600 transition-colors">${ukrCategory}</a></li>
        <li><i data-lucide="chevron-right" class="w-4 h-4"></i></li>
        <li class="text-gray-900 font-medium truncate max-w-[200px] sm:max-w-none">${product.productName}</li>
    `;

    // 2. Логіка зображень
    const imagePath = product.photo || 'https://via.placeholder.com/500';
    const mainImgEl = document.getElementById("mainImage");
    mainImgEl.src = imagePath;
    mainImgEl.alt = product.productName;

    document.getElementById("thumbnailsContainer").innerHTML = `
        <button class="thumb-btn flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 border-blue-600 shadow-md">
            <img src="${imagePath}" alt="Головне фото" class="w-full h-full object-cover">
        </button>
    `;

    // 3. Текстові дані панелі покупки
    document.getElementById("productBrand").textContent = product.manufacturer;
    document.getElementById("productName").textContent = product.productName;
    document.getElementById("productPrice").textContent = `${parseFloat(product.price).toLocaleString('uk-UA')} ₴`;
    document.getElementById("productSku").textContent = `Артикул: ${product.productId.toString().padStart(6, '0')}`;
    
    const reviewsList = product.reviews || [];
    document.getElementById("reviewsCountBadge").textContent = reviewsList.length;

    // 4. Рендер зірочок рейтингу
    let starsTopHTML = "";
    const currentRating = Math.round(product.rating || 0);
    for (let i = 0; i < 5; i++) {
        starsTopHTML += `<i data-lucide="star" class="w-4 h-4 ${i < currentRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}"></i>`;
    }
    starsTopHTML += `<span class="ml-1 text-sm text-gray-500">(${reviewsList.length} відгуків)</span>`;
    document.getElementById("ratingStarsTop").innerHTML = starsTopHTML;

    // 5. Статус наявності на складі
    const stockContainer = document.getElementById("stockStatus");
    if (product.quantity > 0) {
        stockContainer.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 text-green-600"></i><span class="text-green-600 text-base">В наявності (${product.quantity} шт.)</span>`;
    } else {
        stockContainer.innerHTML = `<i data-lucide="package" class="w-5 h-5 text-orange-500"></i><span class="text-orange-500 text-base">Немає в наявності</span>`;
    }

    // Оновлюємо стан кнопки кошика (Зелена / Синя)
    updateCartButtonUI();

    renderTabContent();
}

// Функція динамічного оновлення кнопки додавання в кошик
function updateCartButtonUI() {
    const cartBtnContainer = document.getElementById("cartButtonContainer");
    if (!cartBtnContainer || !product) return;

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const isInCart = cart.some(item => item.product.productId === product.productId);

    if (isInCart) {
        // Якщо товар у кошику: кнопка стає зеленою і веде в кошик
        cartBtnContainer.innerHTML = `
            <button onclick="window.location.href='cart.html'" class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-600/30 active:scale-95 cursor-pointer">
                <i data-lucide="check" class="w-5 h-5"></i> В кошику
            </button>
        `;
    } else {
        // Якщо товару немає в кошику: стандартна синя кнопка купівлі
        cartBtnContainer.innerHTML = `
            <button onclick="addToCartFromDetails()" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-600/30 active:scale-95 cursor-pointer">
                <i data-lucide="shopping-cart" class="w-5 h-5"></i> Додати до кошика
            </button>
        `;
    }
    // Переініціалізовуємо іконки (check або shopping-cart)
    lucide.createIcons();
}

function switchTab(tabId) {
    currentActiveTab = tabId;
    
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("border-blue-600", "text-blue-600");
        btn.classList.add("border-transparent", "text-gray-600");
    });
    
    const activeBtn = document.getElementById(`tabBtn-${tabId}`);
    activeBtn.classList.remove("border-transparent", "text-gray-600");
    activeBtn.classList.add("border-blue-600", "text-blue-600");

    renderTabContent();
}

function renderTabContent() {
    const contentContainer = document.getElementById("tabContent");
    if (!product) return;

    if (currentActiveTab === 'description') {
        contentContainer.innerHTML = `
            <div class="prose max-w-3xl text-gray-700 leading-relaxed">
                <h3 class="text-xl font-bold text-gray-900 mb-4">Огляд ${product.productName}</h3>
                <p class="whitespace-pre-line">${product.description || 'Опис відсутній.'}</p>
            </div>`;
    } 
    
    else if (currentActiveTab === 'specs') {
        const localizedCondition = CONDITION_MAP[product.condition] || product.condition;

        let specsRows = `
            <tr class="border-b border-gray-100 bg-gray-50/50">
                <th class="py-4 px-6 font-medium text-gray-600 w-1/3">Виробник</th>
                <td class="py-4 px-6 text-gray-900 font-medium">${product.manufacturer}</td>
            </tr>
            <tr class="border-b border-gray-100">
                <th class="py-4 px-6 font-medium text-gray-600 w-1/3">Стан</th>
                <td class="py-4 px-6 text-gray-900 font-medium">${localizedCondition}</td>
            </tr>`;

        let rowIdx = 0;
        Object.entries(product).forEach(([key, value]) => {
            if (SPEC_LABELS[key] && value !== null && value !== undefined && value !== '') {
                const label = SPEC_LABELS[key];
                const bgClass = rowIdx % 2 === 0 ? 'bg-gray-50/50' : '';
                
                let displayValue = value;
                if (typeof value === 'boolean' || key === 'keySensetivity') {
                    displayValue = (value === true || value === 1 || value === "true") ? 'Є (чутлива до сили натискання)' : 'Немає';
                }

                specsRows += `
                    <tr class="border-b border-gray-100 ${bgClass}">
                        <th class="py-4 px-6 font-medium text-gray-600 w-1/3">${label}</th>
                        <td class="py-4 px-6 text-gray-900 font-medium">${displayValue}</td>
                    </tr>`;
                rowIdx++;
            }
        });

        contentContainer.innerHTML = `
            <div class="max-w-3xl">
                <h3 class="text-xl font-bold text-gray-900 mb-6">Технічні характеристики</h3>
                <div class="rounded-xl border border-gray-200 overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <tbody>${specsRows}</tbody>
                    </table>
                </div>
            </div>`;
    } 
    
    else if (currentActiveTab === 'reviews') {
        const reviewsList = product.reviews || [];
        let reviewsHTML = `
            <div class="flex items-center justify-between mb-8">
                <h3 class="text-xl font-bold text-gray-900">Відгуки клієнтів</h3>
                <button onclick="if(typeof showToast === 'function') showToast('Форма відгуку буде доступна після авторизації', 'info')" class="text-blue-600 font-medium hover:underline flex items-center gap-2 cursor-pointer">
                    <i data-lucide="message-square" class="w-4 h-4"></i> Залишити відгук
                </button>
            </div>`;

        if (reviewsList.length > 0) {
            reviewsHTML += '<div class="space-y-6">';
            reviewsList.forEach(review => {
                let reviewStars = "";
                for (let i = 0; i < 5; i++) {
                    reviewStars += `<i data-lucide="star" class="w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}"></i>`;
                }
                reviewsHTML += `
                    <div class="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div class="flex justify-between items-start mb-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-lg">
                                    ${review.author.charAt(0)}
                                </div>
                                <div>
                                    <p class="font-bold text-gray-900">${review.author}</p>
                                    <p class="text-xs text-gray-500">${review.date}</p>
                                </div>
                            </div>
                            <div class="flex">${reviewStars}</div>
                        </div>
                        <p class="text-gray-700">${review.text}</p>
                    </div>`;
            });
            reviewsHTML += '</div>';
        } else {
            reviewsHTML += `
                <div class="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p class="text-gray-500">Поки що немає відгуків про цей товар. Будьте першим!</p>
                </div>`;
        }
        contentContainer.innerHTML = `<div class="max-w-3xl">${reviewsHTML}</div>`;
    }

    lucide.createIcons();
}

// Функція швидкої купівлі в один клік
function handleQuickBuy() {
    if (!product) return;
    if (typeof showToast === 'function') {
        showToast(`Заявку на швидку купівлю "${product.productName}" створено! Менеджер зв'яжеться з вами.`, 'success', 5000);
    }
}

// Функція додавання у кошик
function addToCartFromDetails() {
    if (!product) return;
    if (product.quantity <= 0) {
        if (typeof showToast === 'function') showToast("На жаль, товару немає в наявності", "error");
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.product.productId === product.productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            product: {
                productId: product.productId,
                productName: product.productName,
                category: product.category,
                price: product.price,
                photo: product.photo
            }, 
            quantity: 1 
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    
    if (typeof showToast === 'function') {
        showToast(`"${product.productName}" додано до кошика!`, 'success');
    }
    
    updateCartButtonUI();
}

// Запуск модуля
loadProductData();