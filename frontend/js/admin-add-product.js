const categorySelect = document.getElementById("categorySelect");
const addProductForm = document.getElementById("addProductForm");
const saveBtn = document.getElementById("saveProductBtn");
const saveBtnText = document.getElementById("saveBtnText");
const formTitle = document.getElementById("mainFormTitle");
const formSubtitle = document.getElementById("mainFormSubtitle");

// Визначення режиму роботи сторінки: створення або редагування товару
const urlParams = new URLSearchParams(window.location.search);
const editProductId = urlParams.get('id');
const isEditMode = editProductId !== null;

// Ініціалізація сторінки після повного завантаження DOM
document.addEventListener("DOMContentLoaded", () => {
    if (isEditMode) {
        preparePageForEditMode();
    } else {
        if (window.lucide) lucide.createIcons();
    }
});

async function preparePageForEditMode() {
    // Оновлення елементів інтерфейсу для режиму редагування
    formTitle.textContent = "Редагування інформації про товар";
    formSubtitle.textContent = `Модифікація атрибутів інструменту з ID: ${editProductId.padStart(6, '0')}`;
    saveBtnText.textContent = "Оновити інструмент у базі даних";
    
    const pageIconBox = document.getElementById("pageIconBox");
    if(pageIconBox) pageIconBox.className = "p-2 bg-amber-50 text-amber-600 rounded-lg";
    
    const breadcrumbActive = document.getElementById("breadcrumbActive");
    if(breadcrumbActive) breadcrumbActive.innerHTML = `<i data-lucide="edit-3" class="w-4 h-4 text-amber-600"></i> Редагування інструменту`;

    // Блокування зміни категорії під час редагування
    categorySelect.disabled = true;
    categorySelect.parentNode.classList.add("opacity-60", "cursor-not-allowed");

    try {
        // Отримання даних товару з сервера
        const response = await fetch(`http://localhost:8080/api/products?id=${editProductId}`);
        if (!response.ok) throw new Error("Товар не знайдено в базі");
        const product = await response.json();

        // Заповнення основних полів форми
        document.getElementById("productName").value = product.productName || "";
        document.getElementById("manufacturer").value = product.manufacturer || "";
        document.getElementById("price").value = product.price || 0;
        document.getElementById("quantity").value = product.quantity || 0;
        document.getElementById("condition").value = product.condition || "New";
        document.getElementById("description").value = product.description || "";
        
        const sysCat = product.category.toLowerCase();
        categorySelect.value = sysCat;
        
        const activeBlock = document.getElementById(`fields-${sysCat}`);
        if (activeBlock) activeBlock.classList.remove("hidden");

        // Заповнення полів відповідної категорії товару
        if (sysCat === "guitars") {
            document.getElementById("guitarType").value = product.type || "";
            document.getElementById("guitarBody").value = product.bodyMaterial || "";
            document.getElementById("guitarNeck").value = product.neckMaterial || "";
            document.getElementById("guitarFrets").value = product.numberOfFrets || "";
            document.getElementById("guitarStrings").value = product.numberOfStrings || "";
            document.getElementById("guitarPickups").value = product.pickupType || "";
        } else if (sysCat === "keyboards") {
            document.getElementById("keyboardType").value = product.type || "";
            document.getElementById("keyboardKeys").value = product.numberOfKeys || "";
            document.getElementById("keyboardPolyphony").value = product.polyphony || "";
            document.getElementById("keyboardSensitivity").checked = (product.keySensetivity === true || product.keySensetivity === 1);
        } else if (sysCat === "drums") {
            document.getElementById("drumType").value = product.type || "";
            document.getElementById("drumConfiguration").value = product.configuration || "";
            document.getElementById("drumBodyMaterial").value = product.bodyMaterial || "";
        } else if (sysCat === "winds") {
            document.getElementById("windType").value = product.type || "";
            document.getElementById("windMaterial").value = product.material || "";
            document.getElementById("windScaleRange").value = product.scaleRange || "";
        }

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Помилка завантаження даних для редагування:", error);

        // Відображення повідомлення про помилку
        if (typeof showToast === 'function') {
            showToast("Помилка завантаження даних товару з БД!", "error");
        }
    }
}

// Перемикання відображення полів залежно від обраної категорії
categorySelect.addEventListener("change", function(e) {
    const selectedCategory = e.target.value;

    // Приховування всіх блоків специфічних полів
    document.querySelectorAll(".isa-fields").forEach(block => block.classList.add("hidden"));

    // Відображення полів активної категорії
    if (selectedCategory) {
        const activeBlock = document.getElementById(`fields-${selectedCategory}`);
        if (activeBlock) activeBlock.classList.remove("hidden");
    }

    if (window.lucide) lucide.createIcons();
});

// Обробка відправки форми створення або редагування товару
addProductForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    // Отримання даних із форми
    const name = document.getElementById("productName").value.trim();
    const manufacturer = document.getElementById("manufacturer").value.trim();
    const price = parseFloat(document.getElementById("price").value);
    const quantity = parseInt(document.getElementById("quantity").value);
    const condition = document.getElementById("condition").value;
    const description = document.getElementById("description").value.trim();
    const category = categorySelect.value;

    // Перевірка коректності введеної ціни
    if (price <= 0) {
        if (typeof showToast === 'function') {
            showToast("Ціна інструменту повинна бути більшою за 0 ₴!", "error");
        }
        return;
    }

    // Перевірка коректності кількості товару
    if (quantity < 0) {
        if (typeof showToast === 'function') {
            showToast("Кількість товару на складі не може бути від'ємною!", "error");
        }
        return;
    }

    let specificData = {};

    // Формування специфічних даних залежно від категорії товару
    if (category === "guitars") {
        specificData = {
            type: document.getElementById("guitarType").value.trim(),
            bodyMaterial: document.getElementById("guitarBody").value.trim(),
            neckMaterial: document.getElementById("guitarNeck").value.trim(),
            numberOfFrets: parseInt(document.getElementById("guitarFrets").value) || 22,
            numberOfStrings: parseInt(document.getElementById("guitarStrings").value) || 6,
            pickupType: document.getElementById("guitarPickups").value.trim()
        };
    } else if (category === "keyboards") {
        specificData = {
            type: document.getElementById("keyboardType").value.trim(),
            numberOfKeys: parseInt(document.getElementById("keyboardKeys").value) || 88,
            polyphony: parseInt(document.getElementById("keyboardPolyphony").value) || 128,
            keySensetivity: document.getElementById("keyboardSensitivity").checked
        };
    } else if (category === "drums") {
        specificData = {
            type: document.getElementById("drumType").value.trim(),
            configuration: document.getElementById("drumConfiguration").value.trim(),
            bodyMaterial: document.getElementById("drumBodyMaterial").value.trim()
        };
    } else if (category === "winds") {
        specificData = {
            type: document.getElementById("windType").value.trim(),
            material: document.getElementById("windMaterial").value.trim(),
            scaleRange: document.getElementById("windScaleRange").value.trim()
        };
    }

    // Формування об'єкта для відправки на сервер
    const payload = {
        productName: name,
        category: category,
        manufacturer: manufacturer,
        price: price,
        quantity: quantity,
        condition: condition,
        description: description,
        specificData: specificData
    };

    // Додавання ID товару в режимі редагування
    if (isEditMode) {
        payload.productId = parseInt(editProductId);
    }

    // Блокування кнопки та відображення індикатора завантаження
    const originalContent = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.classList.add("opacity-70");
    saveBtn.innerHTML = '<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';

    // Визначення URL та HTTP-методу залежно від режиму роботи
    const apiUrl = isEditMode ? 'http://localhost:8080/api/admin/update-product' : 'http://localhost:8080/api/admin/add-product';
    const httpMethod = isEditMode ? 'PUT' : 'POST';

    try {
        // Надсилання даних на сервер
        const response = await fetch(apiUrl, {
            method: httpMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error("Помилка транзакції СУБД");

        const data = await response.json();

        if (data.status === "success") {

            // Відображення повідомлення про успішне виконання операції
            if (typeof showToast === 'function') {
                if (isEditMode) {
                    showToast(`Інструмент "${name}" успішно оновлено в базі даних!`, "success");
                } else {
                    showToast(`Новий інструмент "${name}" успішно внесено до СУБД!`, "success");
                }
            }

            if (!isEditMode) {
                // Очищення форми після створення нового товару
                addProductForm.reset();
                document.querySelectorAll(".isa-fields").forEach(block => block.classList.add("hidden"));
            } else {
                // Перехід до панелі адміністратора після редагування
                setTimeout(() => window.location.href = 'admin-dashboard.html', 1200);
            }

        } else {
            if (typeof showToast === 'function') {
                showToast("Помилка бази даних: " + data.message, "error");
            }
        }

    } catch (error) {
        console.error("Помилка відправки:", error);

        // Відображення повідомлення про помилку з'єднання
        if (typeof showToast === 'function') {
            showToast("Не вдалося зв'язатися з сервером Java!", "error");
        }

    } finally {
        // Відновлення початкового стану кнопки
        saveBtn.disabled = false;
        saveBtn.classList.remove("opacity-70");
        saveBtn.innerHTML = originalContent;

        if (window.lucide) lucide.createIcons();
    }
});