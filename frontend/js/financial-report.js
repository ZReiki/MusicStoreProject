async function buildFinancialReport() {
    const from = document.getElementById("finFrom").value;
    const to = document.getElementById("finTo").value;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/financial-report?from=${from}&to=${to}`);
        if (!response.ok) throw new Error("Помилка фінансового модуля");
        const data = await response.json();

        // Глобальні лічильники для фінансового підсумку
        let totalRev = 0;
        let totalCost = 0;
        let totalGross = 0;
        let totalTax = 0;

        const tbody = document.getElementById("financialTableBody");

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-gray-400 italic">Немає фінансових надходжень за період</td></tr>`;
            resetDocumentCounters();
            return;
        }

        // 1. ГРУПУВАННЯ: Створюємо дерево "Категорія -> Масив проданих товарів"
        const groupedData = {};
        data.forEach(row => {
            const cat = row.category || "Інше";
            if (!groupedData[cat]) groupedData[cat] = [];
            groupedData[cat].push(row);
        });

        let tableHtml = "";
        let catIndex = 0;

        // 2. РЕНДЕРИНГ: Проходимо по кожній знайденій категорії
        Object.keys(groupedData).forEach(catKey => {
            const itemsInCat = groupedData[catKey];
            catIndex++;
            // Створюємо унікальний ID для цієї групи категорій (напр. cat-group-1)
            const catId = `cat-group-${catIndex}`; 

            let catQty = 0;
            let catRevenue = 0;
            let catCost = 0;
            let catGross = 0;

            // Рахуємо агреговані суми для заголовка категорії
            itemsInCat.forEach(item => {
                catQty += (item.qty || 0);
                catRevenue += (item.revenue || 0);
                catCost += (item.costPrice || 0);
                catGross += (item.grossProfit || 0);

                totalRev += (item.revenue || 0);
                totalCost += (item.costPrice || 0);
                totalGross += (item.grossProfit || 0);
                totalTax += (item.tax || 0);
            });

            // Рядок самої категорії (на яку клікають)
            // Функція toggleCategoryRows передає унікальний catId
            tableHtml += `
                <tr onclick="toggleCategoryRows('${catId}')" class="bg-gray-50/80 hover:bg-blue-50/40 border-y border-gray-100 transition-colors cursor-pointer select-none font-bold text-gray-900 group">
                    <td class="py-3.5 px-4 flex items-center gap-3">
                        <i data-lucide="chevron-right" id="arrow-${catId}" class="w-4 h-4 text-blue-600 transition-transform duration-200"></i>
                        <span class="text-sm tracking-wide font-extrabold text-gray-800">${catKey}</span>
                        <span class="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">${catQty} шт.</span>
                    </td>
                    <td class="py-3.5 px-4 text-right font-black text-gray-900 text-sm">${catRevenue.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-3.5 px-4 text-right text-gray-400 font-medium text-xs">-${catCost.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-3.5 px-4 text-right text-emerald-700 font-black whitespace-nowrap text-sm bg-emerald-50/10">${catGross.toLocaleString('uk-UA')} ₴</td>
                </tr>
            `;

            // 3. ДОДАВАННЯ ПРОДАНІХ ТОВАРІВ
            itemsInCat.forEach(item => {
                const itemId = item.id ? item.id.toString().padStart(4, '0') : '0000';
                const itemManufacturer = item.manufacturer || 'Невказано';
                const itemName = item.name || 'Музичний інструмент';
                const itemQty = item.qty || 0;
                const unitPrice = item.unitPrice || 0;
                
                const itemRevenue = item.revenue || 0;
                const itemCost = item.costPrice || 0;
                const itemGross = item.grossProfit || 0;

                tableHtml += `
                    <tr class="${catId} hidden bg-white transition-all text-xs border-b border-gray-50 hover:bg-gray-50/50">
                        <td class="py-2.5 px-4 pl-10 text-gray-700 font-medium flex items-center justify-between gap-4 min-w-0">
                            <div class="flex items-center gap-2 min-w-0 flex-1">
                                <span class="text-gray-400 shrink-0">•</span> 
                                <span class="text-gray-400 font-mono text-[10px] shrink-0">#${itemId}</span> 
                                <span class="text-gray-500 font-semibold shrink-0">[${itemManufacturer}]</span> 
                                <span class="text-gray-950 font-bold truncate" title="${itemManufacturer} ${itemName}">${itemName}</span> 
                            </div>
                            
                            <div class="flex items-center gap-3 shrink-0 whitespace-nowrap text-right pr-2">
                                <span class="text-gray-400 font-normal text-[11px]">${unitPrice.toLocaleString('uk-UA')} ₴ / шт.</span>
                                <span class="text-indigo-600 font-black bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-mono">× ${itemQty} шт.</span>
                            </div>
                        </td>
                        <td class="py-2.5 px-4 text-right text-gray-600 font-mono font-semibold">${itemRevenue.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-2.5 px-4 text-right text-red-400 font-mono">-${itemCost.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-2.5 px-4 text-right text-emerald-600 font-bold font-mono whitespace-nowrap">+${itemGross.toLocaleString('uk-UA')} ₴</td>
                    </tr>
                `;
            });
        });

        tbody.innerHTML = tableHtml;

        // --- ЕКОНОМІЧНЕ ЗВЕДЕННЯ (ПРАВА ПАНЕЛЬ) ---
        const rentCost = 15000;
        const salaryCost = 25000;
        const logisticsCost = totalRev * 0.03; // Логістика 3%

        const totalOperatingExpenses = rentCost + salaryCost + logisticsCost;
        const ebt = totalGross - totalOperatingExpenses;
        const netProfit = ebt - totalTax;

        // Оновлюємо картки та калькулятор справа
        document.getElementById("cardRevenue").textContent = `${totalRev.toLocaleString('uk-UA')} ₴`;
        document.getElementById("cardGrossProfit").textContent = `${totalGross.toLocaleString('uk-UA')} ₴`;
        document.getElementById("cardExpenses").textContent = `${totalOperatingExpenses.toLocaleString('uk-UA')} ₴`;
        document.getElementById("cardNetProfit").textContent = `${netProfit.toLocaleString('uk-UA')} ₴`;

        document.getElementById("docRevenue").textContent = `${totalRev.toLocaleString('uk-UA')} ₴`;
        document.getElementById("docCostPrice").textContent = `-${totalCost.toLocaleString('uk-UA')} ₴`;
        
        document.getElementById("docCostPriceDetail").textContent = `${totalCost.toLocaleString('uk-UA')} ₴`;
        
        document.getElementById("docGrossProfit").textContent = `${totalGross.toLocaleString('uk-UA')} ₴`;
        document.getElementById("docLogistics").textContent = `-${logisticsCost.toLocaleString('uk-UA')} ₴`;
        document.getElementById("docEBT").textContent = `${ebt.toLocaleString('uk-UA')} ₴`;
        document.getElementById("docTaxes").textContent = `-${totalTax.toLocaleString('uk-UA')} ₴`;
        
        const netProfitCell = document.getElementById("docNetProfit");
        netProfitCell.textContent = `${netProfit.toLocaleString('uk-UA')} ₴`;

        // Зміна кольору плашки чистого прибутку залежно від результату діяльності
        const cardContainer = document.getElementById("cardNetProfitContainer");
        const docContainer = document.getElementById("docNetProfitContainer");

        if (netProfit < 0) {
            // Якщо збиток — робимо верхню 4-ту картку червоною
            cardContainer.className = "bg-red-50 p-4 rounded-2xl border border-red-100 shadow-2xs print-card";
            docContainer.className = "p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between gap-4 mt-4";
            document.getElementById("cardNetProfit").className = "text-xl font-black text-red-600 mt-1";
            netProfitCell.className = "text-xl font-black text-red-600 whitespace-nowrap";
        } else {
            // Якщо прибуток — робимо її зеленою
            cardContainer.className = "bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 shadow-2xs print-card";
            docContainer.className = "p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-4 mt-4";
            document.getElementById("cardNetProfit").className = "text-xl font-black text-emerald-700 mt-1";
            netProfitCell.className = "text-xl font-black text-emerald-700 whitespace-nowrap";
        }

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error(error);
        if (typeof showToast === 'function') showToast("Помилка калькуляції балансу!", "error");
    }
}

// Функція розгортання/згортання рядків (Accordion)
function toggleCategoryRows(catId) {
    // Шукаємо всі дочірні рядки товарів, які мають клас, що дорівнює catId
    const rows = document.querySelectorAll(`.${catId}`);
    const arrow = document.getElementById(`arrow-${catId}`);

    rows.forEach(row => {
        row.classList.toggle('hidden');
    });

    if (arrow) {
        arrow.classList.toggle('rotate-90');
    }
}

function resetDocumentCounters() {
    const zero = "0 ₴";
    document.getElementById("cardRevenue").textContent = zero;
    document.getElementById("cardGrossProfit").textContent = zero;
    document.getElementById("cardNetProfit").textContent = zero;
    document.getElementById("docRevenue").textContent = zero;
    document.getElementById("docCostPrice").textContent = zero;
    document.getElementById("docGrossProfit").textContent = zero;
    document.getElementById("docLogistics").textContent = zero;
    document.getElementById("docEBT").textContent = zero;
    document.getElementById("docTaxes").textContent = zero;
    document.getElementById("docNetProfit").textContent = zero;
    if(document.getElementById("docCostPriceDetail")) document.getElementById("docCostPriceDetail").textContent = zero;
}

document.addEventListener("DOMContentLoaded", () => {
    buildFinancialReport();
});