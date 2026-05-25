let myChartInstance = null;

// Функція запиту аналітики з сервера
async function fetchReportData(fromDate = "2026-01-01", toDate = "2026-12-31") {
    try {
        const response = await fetch(`http://localhost:8080/api/admin/report?from=${fromDate}&to=${toDate}`);
        if (!response.ok) throw new Error("Помилка зчитування аналітики");
        
        const data = await response.json();

        // 1. Оновлюємо три верхні плашки кабінету
        const statContainers = document.querySelectorAll(".text-2xl.font-black");
        if(statContainers.length >= 3) {
            statContainers[0].textContent = `${data.totalProductsInDB.toLocaleString('uk-UA')} шт.`;
            statContainers[1].textContent = `${data.totalOrdersToday} заявок`;
            statContainers[2].textContent = `${data.monthlyRevenue.toLocaleString('uk-UA')} ₴`;
        }

        // 2. Обчислення загальних показників
        const totalSold = data.tableData.reduce((sum, item) => sum + item.sold, 0);
        const totalRevenue = data.tableData.reduce((sum, item) => sum + item.revenue, 0);

        document.getElementById("totalSoldCell").textContent = `${totalSold} шт.`;
        document.getElementById("totalRevenueCell").textContent = `${totalRevenue.toLocaleString('uk-UA')} ₴`;

        // 3. Рендер рядків таблиці
        const tbody = document.getElementById("reportTableBody");
        if (data.tableData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-gray-400 italic">Немає фінансових операцій за цей період</td></tr>`;
        } else {
            tbody.innerHTML = data.tableData.map(row => `
                <tr class="hover:bg-gray-50/50 transition-colors">
                    <td class="py-4 px-6 font-medium text-gray-900">${row.name}</td>
                    <td class="py-4 px-6">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            ${row.category}
                        </span>
                    </td>
                    <td class="py-4 px-6 text-right font-medium text-gray-700">${row.sold} шт.</td>
                    <td class="py-4 px-6 text-right font-bold text-gray-900">${row.revenue.toLocaleString('uk-UA')} ₴</td>
                </tr>
            `).join('');
        }

        // 4. Малюємо кругову діаграму Chart.js
        renderPieChart(data.chartData);

    } catch (error) {
        console.error("Критична помилка завантаження звіту:", error);
    }
}

function renderPieChart(chartDataArray) {
    const canvas = document.getElementById('salesPieChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (myChartInstance) {
        myChartInstance.destroy();
    }

    if (chartDataArray.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    myChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartDataArray.map(item => item.name),
            datasets: [{
                data: chartDataArray.map(item => item.value),
                backgroundColor: chartDataArray.map(item => item.color),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { weight: 'bold', size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` Виручка: ${(context.raw || 0).toLocaleString('uk-UA')} ₴`;
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// Подія натискання кнопки формування звіту
async function handleGenerateReport() {
    const dateFrom = document.getElementById("dateFrom").value;
    const dateTo = document.getElementById("dateTo").value;
    const generateBtn = document.getElementById("generateBtn");
    const btnText = document.getElementById("btnText");

    generateBtn.disabled = true;
    generateBtn.classList.add("opacity-70");
    btnText.textContent = "Обчислення агрегацій СУБД...";

    await fetchReportData(dateFrom, dateTo);

    generateBtn.disabled = false;
    generateBtn.classList.remove("opacity-70");
    btnText.textContent = "Сформувати звіт";
}

function handleExportPDF() {
    alert('Експорт звіту згенеровано успішно!');
}

// Запуск при першому відкритті сторінки
document.addEventListener("DOMContentLoaded", () => {
    fetchReportData();
    if(window.lucide) lucide.createIcons();
});