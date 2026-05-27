const CATEGORY_MAP = {
    "Guitars": "ГІТАРИ",
    "Keyboards": "КЛАВІШНІ",
    "Drums": "УДАРНІ",
    "Winds": "ДУХОВІ"
};

async function buildDailyReport() {
    const reportDate = document.getElementById("targetReportDate").value || "2026-05-26";

    try {
        const response = await fetch(`http://localhost:8080/api/admin/daily-movement-report?date=${reportDate}`);
        if (!response.ok) throw new Error("Помилка аудиту СУБД");
        const data = await response.json();

        const tbody = document.getElementById("movementTableBody");
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" class="py-12 text-center text-gray-400 italic">Жодних фінансових чи матеріальних операцій не зафіксовано</td></tr>`;
            return;
        }

        // Групування за категоріями товарів
        const groupedData = {};
        data.forEach(row => {
            const cat = row.category || "Інше";
            if (!groupedData[cat]) groupedData[cat] = [];
            groupedData[cat].push(row);
        });

        // Глобальні лічильники магазину (Grand Total)
        let globalStart = 0;
        let globalSold = 0;
        let globalEnd = 0;
        let globalRev = 0;
        let globalCapital = 0; // Заморожений капітал на складі всього

        let finalHtml = "";

        Object.keys(groupedData).forEach(catKey => {
            const productsInCat = groupedData[catKey];
            const ukrCategoryName = CATEGORY_MAP[catKey] || catKey.toUpperCase();

            // Локальні підсумки по групі (Subtotals)
            let subStart = 0;
            let subSold = 0;
            let subEnd = 0;
            let subRev = 0;
            let subCapital = 0;

            finalHtml += `
                <tr class="bg-slate-100 border-y border-gray-200 font-black text-gray-700 tracking-wider">
                    <td colspan="10" class="py-3 px-6 text-xs text-left uppercase">
                        📁 ГРУПА АСОРТИМЕНТУ: ${ukrCategoryName} (${productsInCat.length} найменувань)
                    </td>
                </tr>
            `;

            productsInCat.forEach(row => {
                const currentPrice = row.price || 0;
                const soldToday = row.soldToday || 0;
                const endStock = row.endStock || 0;
                const startStock = row.startStock || 0;
                const revenueToday = row.revenueToday || 0;

                // Новий маркетинговий показник: капіталізація поточного залишку
                const itemCapital = endStock * currentPrice;

                // Обчислення відсотка обіговості інструменту за день
                const itemTurnover = startStock > 0 ? ((soldToday / startStock) * 100) : 0;

                // Накопичення субтоталів групи
                subStart += startStock;
                subSold += soldToday;
                subEnd += endStock;
                subRev += revenueToday;
                subCapital += itemCapital;

                // Накопичення глобальних тоталів
                globalStart += startStock;
                globalSold += soldToday;
                globalEnd += endStock;
                globalRev += revenueToday;
                globalCapital += itemCapital;

                // Динамічний бізнес-статус
                let statusLabel = "Залежався";
                let statusClass = "bg-gray-50 text-gray-500 border-gray-200";

                if (endStock === 0 && soldToday > 0) {
                    statusLabel = "ДЕФІЦИТ (0 шт)";
                    statusClass = "bg-red-50 text-red-700 border-red-200 font-black animate-pulse";
                } else if (itemTurnover >= 30) {
                    statusLabel = "ВИСОКИЙ ПОПИТ";
                    statusClass = "bg-amber-50 text-amber-700 border-amber-200 font-bold";
                } else if (soldToday > 0) {
                    statusLabel = "Ходовий";
                    statusClass = "bg-green-50 text-green-700 border-green-200";
                }

                finalHtml += `
                    <tr class="hover:bg-gray-50/40 transition-colors">
                        <td class="py-3 px-4 text-center font-mono text-xs text-gray-400">#${row.id.toString().padStart(4, '0')}</td>
                        <td class="py-3 px-4 font-bold text-gray-900 pl-6">${row.manufacturer} ${row.name}</td>
                        <td class="py-3 px-4 text-right font-medium text-gray-500">${currentPrice.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-3 px-4 text-center font-medium text-gray-700 bg-gray-50/30">${startStock} шт.</td>
                        <td class="py-3 px-4 text-center font-black text-indigo-700 bg-indigo-50/10">${soldToday} шт.</td>
                        <td class="py-3 px-4 text-center font-medium text-gray-700 bg-gray-50/30">${endStock} шт.</td>
                        <td class="py-3 px-4 text-right font-black text-green-700 bg-green-50/5">${revenueToday.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-3 px-4 text-right font-bold text-amber-600">${itemCapital.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-3 px-4 text-center font-bold text-gray-600">${itemTurnover.toFixed(1)}%</td>
                        <td class="py-3 px-4 text-center">
                            <span class="inline-flex items-center px-2 py-0.5 text-[11px] border rounded-md whitespace-nowrap ${statusClass}">
                                ${statusLabel}
                            </span>
                        </td>
                    </tr>
                `;
            });

            // Рядок фінансово-матеріального підсумку групи (Subtotal)
            const subTurnover = subStart > 0 ? ((subSold / subStart) * 100) : 0;

            finalHtml += `
                <tr class="bg-blue-50/40 font-bold text-gray-700 border-b-2 border-gray-200 text-xs uppercase tracking-wide">
                    <td colspan="3" class="py-2.5 px-4 text-right font-extrabold text-blue-900">Підсумок ${ukrCategoryName}:</td>
                    <td class="py-2.5 px-4 text-center bg-gray-100/50">${subStart} шт.</td>
                    <td class="py-2.5 px-4 text-center bg-indigo-100/20 text-indigo-700">${subSold} шт.</td>
                    <td class="py-2.5 px-4 text-center bg-gray-100/50">${subEnd} шт.</td>
                    <td class="py-2.5 px-4 text-right text-green-700 font-black">${subRev.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-2.5 px-4 text-right text-amber-700 font-black">${subCapital.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-2.5 px-4 text-center text-blue-900">${subTurnover.toFixed(1)}%</td>
                    <td></td>
                </tr>
            `;
        });

        tbody.innerHTML = finalHtml;

        // 3. ВИВЕДЕННЯ ГЛОБАЛЬНИХ МЕТРИК ПІДПРИЄМСТВА (GRAND TOTAL)
        document.getElementById("totalStartQty").textContent = `${globalStart} шт.`;
        document.getElementById("totalSoldQty").textContent = `${globalSold} шт.`;
        document.getElementById("totalEndQty").textContent = `${globalEnd} шт.`;
        document.getElementById("totalRevenueDay").textContent = `${globalRev.toLocaleString('uk-UA')} ₴`;
        document.getElementById("totalCapitalDay").textContent = `${globalCapital.toLocaleString('uk-UA')} ₴`;
        
        const globalTurnover = globalStart > 0 ? ((globalSold / globalStart) * 100) : 0;
        document.getElementById("totalTurnoverDay").textContent = `${globalTurnover.toFixed(1)}%`;

        if (typeof showToast === 'function') showToast("Маркетинговий товарний баланс сформовано!", "success");

    } catch (error) {
        console.error(error);
        if (typeof showToast === 'function') showToast("Помилка фінансового розрахунку!", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    buildDailyReport();
    if (window.lucide) lucide.createIcons();
});