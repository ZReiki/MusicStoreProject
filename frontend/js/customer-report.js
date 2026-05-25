let customerChartInstance = null;

async function generateCustomerReport() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/customer-activity-report');
        if (!response.ok) throw new Error("Помилка сервера аналітики клієнтів");
        const data = await response.json();

        document.getElementById("totalCustomersBadge").textContent = `${data.length} покупців`;

        const tbody = document.getElementById("customerTableBody");
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-16 text-center text-gray-400 italic">База даних покупців порожня</td></tr>`;
            return;
        }

        // Лічильники сегментів для графіка
        let counts = { vip: 0, regular: 0, newcomer: 0, passive: 0 };

        tbody.innerHTML = data.map(client => {
            const spent = client.totalSpent || 0;
            const orders = client.ordersCount || 0;
            
            // Динамічна RFM-сегментація на фронтенді
            let segmentLabel = "Пасивний";
            let segmentClass = "bg-red-50 text-red-700 border-red-200";
            
            if (spent > 50000) {
                segmentLabel = "VIP Клієнт";
                segmentClass = "bg-amber-50 text-amber-700 border-amber-200 font-black";
                counts.vip++;
            } else if (spent >= 10000) {
                segmentLabel = "Постійний";
                segmentClass = "bg-blue-50 text-blue-700 border-blue-200 font-bold";
                counts.regular++;
            } else if (spent > 0) {
                segmentLabel = "Новачок";
                segmentClass = "bg-gray-100 text-gray-700 border-gray-200";
                counts.newcomer++;
            } else {
                counts.passive++;
            }

            const fullName = `${client.lastName} ${client.firstName}`;
            const phone = client.phone || '—';

            return `
                <tr class="hover:bg-gray-50/40 transition-colors">
                    <td class="py-4 px-6">
                        <div class="font-bold text-gray-900">${fullName}</div>
                        <div class="text-xs text-gray-400 font-mono">ID: #${client.id.toString().padStart(4, '0')}</div>
                    </td>
                    <td class="py-4 px-6 text-sm">
                        <div class="text-gray-700 font-medium">${phone}</div>
                        <div class="text-xs text-gray-400">${client.email}</div>
                    </td>
                    <td class="py-4 px-6 text-center font-bold text-gray-700">${orders} замовл.</td>
                    <td class="py-4 px-6 text-right font-black text-emerald-600">${spent.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-4 px-6 text-center">
                        <span class="inline-flex items-center px-2.5 py-1 text-xs border rounded-lg whitespace-nowrap ${segmentClass}">
                            ${segmentLabel}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        // Будуємо пончик-діаграму розподілу сегментів
        renderDoughnutChart(counts);

        if(typeof showToast === 'function') showToast("Рейтинг клієнтів успішно оновлено!", "success");

    } catch (error) {
        console.error("Помилка:", error);
        if(typeof showToast === 'function') showToast("Не вдалося завантажити активність клієнтів!", "error");
    }
}

function renderDoughnutChart(counts) {
    const ctx = document.getElementById('customerSegmentsChart').getContext('2d');
    
    if (customerChartInstance) {
        customerChartInstance.destroy();
    }

    customerChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['VIP (>50к)', 'Постійні (10-50к)', 'Новачки (<10к)', 'Пасивні (0)'],
            datasets: [{
                data: [counts.vip, counts.regular, counts.newcomer, counts.passive],
                backgroundColor: ['#f59e0b', '#3b82f6', '#94a3b8', '#ef4444'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, font: { size: 11, weight: '500' } }
                }
            },
            cutout: '65%' // Робить кільце більш тонким та сучасним
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    generateCustomerReport();
    if (window.lucide) lucide.createIcons();
});