let categoryChartInstance = null;

async function generateMonthlyReport() {
    const month = document.getElementById("reportMonth").value;
    const year = document.getElementById("reportYear").value;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/category-monthly-report?month=${month}&year=${year}`);
        if (!response.ok) throw new Error("Помилка мережі бекенду");
        const data = await response.json();

        // 1. Обчислення загальних підсумків періоду
        const totalQty = data.reduce((sum, item) => sum + (item.totalQuantity || 0), 0);
        const totalRev = data.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
        const totalPrevRev = data.reduce((sum, item) => sum + (item.prevRevenue || 0), 0);

        document.getElementById("totalQuantityCell").textContent = `${totalQty} шт.`;
        document.getElementById("totalRevenueCell").textContent = `${totalRev.toLocaleString('uk-UA')} ₴`;
        document.getElementById("totalPrevRevenueCell").textContent = `${totalPrevRev.toLocaleString('uk-UA')} ₴`;
        
        // Розрахунок загальної відсоткової динаміки по всьому магазину
        const totalGrowthCell = document.getElementById("totalGrowthCell");
        if (totalPrevRev > 0) {
            const totalGrowth = ((totalRev - totalPrevRev) / totalPrevRev) * 100;
            const sign = totalGrowth > 0 ? '+' : '';
            totalGrowthCell.textContent = `${sign}${totalGrowth.toFixed(1)}%`;
            totalGrowthCell.className = `py-4 px-6 text-center font-bold ${totalGrowth > 0 ? 'text-green-600' : 'text-red-600'}`;
        } else {
            totalGrowthCell.textContent = "-";
            totalGrowthCell.className = "py-4 px-6 text-center text-gray-400";
        }

        // 2. Рендер рядків таблиці показників СУБД
        const tbody = document.getElementById("categoryTableBody");
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-10 text-center text-gray-400 italic">Немає зафіксованих продажів за обраний місяць</td></tr>`;
        } else {
            tbody.innerHTML = data.map(row => {
                const currentRevenue = row.totalRevenue || 0;
                const previousRevenue = row.prevRevenue || 0;
                const totalQuantity = row.totalQuantity || 0;
                const currentGrowth = row.growth || 0;

                const isPositive = currentGrowth >= 0;
                const badgeColor = isPositive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';
                const sign = isPositive ? '▲ +' : '▼ ';

                return `
                    <tr class="hover:bg-gray-50/40 transition-colors">
                        <td class="py-4 px-6 font-bold text-gray-900">${row.category}</td>
                        <td class="py-4 px-6 text-right font-medium text-gray-600">${totalQuantity} шт.</td>
                        <td class="py-4 px-6 text-right font-black text-gray-900">${currentRevenue.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-4 px-6 text-right text-gray-500">${previousRevenue.toLocaleString('uk-UA')} ₴</td>
                        <td class="py-4 px-6 text-center">
                            <span class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold border rounded-lg whitespace-nowrap ${badgeColor}">
                                ${sign}${currentGrowth}%
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // 3. Малюємо стовпчиковую порівняльну діаграму
        renderBarChart(data);

        if (typeof showToast === 'function') showToast("Аналітичне порівняння періодів сформовано!", "success");

    } catch (error) {
        console.error("Помилка:", error);
        if (typeof showToast === 'function') showToast("Помилка обчислення даних!", "error");
    }
}

function renderBarChart(data) {
    const canvas = document.getElementById('monthlyCategoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Якщо графік уже існує — знищуємо інстанс перед перемальовуванням
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }

    if (!data || data.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(i => i.category),
            datasets: [
                {
                    label: 'Поточний місяць',
                    data: data.map(i => i.totalRevenue),
                    backgroundColor: '#3b82f6',
                    borderRadius: 6
                },
                {
                    label: 'Минулий місяць',
                    data: data.map(i => i.prevRevenue),
                    backgroundColor: '#cbd5e1',
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => value.toLocaleString('uk-UA') + ' ₴' }
                }
            },
            plugins: {
                legend: { position: 'top', labels: { font: { weight: 'bold' } } }
            }
        }
    });
}

// Запуск модуля при старті сторінки
document.addEventListener("DOMContentLoaded", () => {
    generateMonthlyReport();
    if (window.lucide) lucide.createIcons();
});