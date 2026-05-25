const CATEGORY_MAP = {
    "Guitars": "Гітари",
    "Keyboards": "Клавішні",
    "Drums": "Ударні",
    "Winds": "Духові"
};

async function generateStockReport() {
    const limit = document.getElementById("criticalLimitInput").value || 5;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/low-stock-report?limit=${limit}`);
        if (!response.ok) throw new Error("Помилка складського сервера");
        const data = await response.json();

        // Оновлюємо лічильник знайдених дефіцитних позицій
        document.getElementById("lowStockCountBadge").textContent = `${data.length} інструментів`;

        const tbody = document.getElementById("stockTableBody");
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="py-16 text-center text-gray-400 italic">
                        <i data-lucide="check-circle-2" class="w-10 h-10 text-green-500 mx-auto mb-3"></i>
                        Всі складські запаси в нормі! Товарів із залишком менше або рівно ${limit} шт. не виявлено.
                    </td>
                </tr>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }

        // Рендер рядків дефіцитних товарів
        tbody.innerHTML = data.map(product => {
            const formattedId = product.productId.toString().padStart(6, '0');
            const ukrCat = CATEGORY_MAP[product.category] || product.category;
            
            // Спеціальні стилі для критичних станів (якщо товару взагалі немає — виділяємо червоним)
            const isZero = product.quantity === 0;
            const stockBadgeColor = isZero 
                ? 'bg-red-50 text-red-700 border-red-200 font-black animate-pulse' 
                : 'bg-orange-50 text-orange-700 border-orange-200 font-bold';
            
            const stockLabel = isZero ? 'Закінчився (0 шт.)' : `${product.quantity} шт.`;

            return `
                <tr class="hover:bg-gray-50/50 transition-colors ${isZero ? 'bg-red-50/10' : ''}">
                    <td class="py-4 px-6 text-xs font-mono text-gray-400">#${formattedId}</td>
                    <td class="py-4 px-6 font-bold text-gray-900">
                        <a href="admin-add-product.html?id=${product.productId}" class="hover:text-orange-500 transition-colors">
                            ${product.productName}
                        </a>
                    </td>
                    <td class="py-4 px-6 text-gray-600 font-medium text-sm">${product.manufacturer}</td>
                    <td class="py-4 px-6">
                        <span class="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                            ${ukrCat}
                        </span>
                    </td>
                    <td class="py-4 px-6 text-right font-bold text-gray-900 text-sm">${product.price.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-4 px-6 text-center">
                        <span class="inline-flex items-center px-2.5 py-1 text-xs border rounded-lg whitespace-nowrap ${stockBadgeColor}">
                            ${stockLabel}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        if (typeof showToast === 'function') showToast(`Звіт сформовано! Знайдено ${data.length} дефіцитних позицій.`, "warning");

    } catch (error) {
        console.error("Помилка:", error);
        if (typeof showToast === 'function') showToast("Не вдалося завантажити складські залишки!", "error");
    }
}

// Запуск при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
    generateStockReport();
    if (window.lucide) lucide.createIcons();
});