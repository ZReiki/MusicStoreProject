let popularChartInstance = null;

const CATEGORY_MAP = {
    "Guitars": "Гітари",
    "Keyboards": "Клавішні",
    "Drums": "Ударні",
    "Winds": "Духові"
};

async function generatePopularReport() {
    const fromDate = document.getElementById("popDateFrom").value;
    const toDate = document.getElementById("popDateTo").value;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/popular-report?from=${fromDate}&to=${toDate}`);
        if (!response.ok) throw new Error("Помилка обробки запиту");
        const data = await response.json();

        const tbody = document.getElementById("popularTableBody");
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-16 text-center text-gray-400 italic">Немає куплених товарів за обраний період</td></tr>`;
            if (popularChartInstance) popularChartInstance.destroy();
            return;
        }

        // Рендер рядків (Місце визначається за індексом, бо дані вже відсортовані бекендом)
        tbody.innerHTML = data.map((row, index) => {
            const rank = index + 1;
            
            // Красиве оформлення перших трьох призових місць
            let medalBadge = `<span class="font-bold text-gray-600">${rank}</span>`;
            if (rank === 1) medalBadge = `<span class="px-2.5 py-1 text-xs font-black bg-yellow-100 text-yellow-800 rounded-full border border-yellow-300">🥇 1 місце</span>`;
            if (rank === 2) medalBadge = `<span class="px-2.5 py-1 text-xs font-black bg-slate-100 text-slate-800 rounded-full border border-slate-300">🥈 2 місце</span>`;
            if (rank === 3) medalBadge = `<span class="px-2.5 py-1 text-xs font-black bg-amber-50 text-amber-800 rounded-full border border-amber-200">🥉 3 місце</span>`;

            const ukrCat = CATEGORY_MAP[row.category] || row.category;

            return `
                <tr class="hover:bg-gray-50/40 transition-colors ${rank <= 3 ? 'bg-indigo-50/5' : ''}">
                    <td class="py-4 px-6 text-center whitespace-nowrap">${medalBadge}</td>
                    <td class="py-4 px-6 font-bold text-gray-900">
                        <a href="admin-add-product.html?id=${row.id}" class="hover:text-indigo-600 transition-colors">${row.manufacturer} ${row.name}</a>
                    </td>
                    <td class="py-4 px-6">
                        <span class="px-2.5 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">${ukrCat}</span>
                    </td>
                    <td class="py-4 px-6 text-right font-black text-indigo-600">${row.sold} шт.</td>
                    <td class="py-4 px-6 text-right font-bold text-gray-900">${row.revenue.toLocaleString('uk-UA')} ₴</td>
                </tr>
            `;
        }).join('');

        // Рендеримо ГОРИЗОНТАЛЬНУ діаграму
        renderHorizontalChart(data);

        if(typeof showToast === 'function') showToast("Рейтинг попиту успішно сформовано з БД!", "success");

    } catch (error) {
        console.error("Помилка:", error);
        if(typeof showToast === 'function') showToast("Не вдалося виконати запит популярності!", "error");
    }
}

function renderHorizontalChart(data) {
    const ctx = document.getElementById('popularProductsChart').getContext('2d');
    
    if (popularChartInstance) {
        popularChartInstance.destroy();
    }

    // Беремо топ-5 для гарного відображення на невеликому графіку
    const topData = data.slice(0, 5);

    popularChartInstance = new Chart(ctx, {
        type: 'asymmetric' in Chart ? 'bar' : 'bar', 
        data: {
            labels: topData.map(i => i.name.length > 15 ? i.name.substring(0, 15) + '...' : i.name),
            datasets: [{
                label: 'Продано штук',
                data: topData.map(i => i.sold),
                backgroundColor: 'rgba(79, 70, 229, 0.85)', // Індиго
                borderColor: 'rgb(79, 70, 229)',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y', // РОБИТЬ СТОВПЧИКИ ГОРИЗОНТАЛЬНИМИ!
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: false } // Ховаємо легенду, бо у нас один тип даних
            }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    generatePopularReport();
    if (window.lucide) lucide.createIcons();
});