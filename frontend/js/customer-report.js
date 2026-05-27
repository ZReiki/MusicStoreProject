async function generateCustomerReport() {
    const fromDate = document.getElementById("crmDateFrom").value || "2026-01-01";
    const toDate = document.getElementById("crmDateTo").value || "2026-12-31";

    try {
        const response = await fetch(`http://localhost:8080/api/admin/customer-activity-report?from=${fromDate}&to=${toDate}`);
        if (!response.ok) throw new Error("Помилка сервера аналітики клієнтів");
        const rawData = await response.json();

        const tbody = document.getElementById("customerTableBody");
        if (!rawData || rawData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="py-16 text-center text-gray-400 italic">База даних покупців порожня</td></tr>`;
            return;
        }

        // 1. СТВОРЕННЯ СТРУКТУРИ: Клієнт -> Чеки -> Товари
        const customersMap = {};
        
        rawData.forEach(row => {
            const cId = row.id;
            if (!customersMap[cId]) {
                customersMap[cId] = {
                    id: cId,
                    fullName: `${row.lastName} ${row.firstName}`,
                    phone: row.phone || '—',
                    email: row.email,
                    address: row.address || 'Адресу доставки не вказано',
                    totalSpent: 0,
                    orders: {} // Об'єкт для зберігання унікальних чеків
                };
            }

            if (row.orderId) {
                const oId = row.orderId;
                const qty = row.qty || 0;
                const price = row.unitPrice || 0;
                const itemTotal = qty * price;
                
                // Накопичуємо загальну суму клієнта (LTV)
                customersMap[cId].totalSpent += itemTotal;
                
                // Ініціалізуємо чек, якщо його ще немає в мапі клієнта
                if (!customersMap[cId].orders[oId]) {
                    customersMap[cId].orders[oId] = {
                        orderId: oId,
                        date: row.orderDate ? row.orderDate.substring(0, 16).replace('T', ' ') : '—',
                        orderTotalSum: 0,
                        items: []
                    };
                }
                
                // Накопичуємо суму конкретного чека
                customersMap[cId].orders[oId].orderTotalSum += itemTotal;
                
                // Додаємо товар всередину цього чека
                customersMap[cId].orders[oId].items.push({
                    product: `[${row.manufacturer || 'Music'}] ${row.productName || 'Інструмент'}`,
                    qty: qty,
                    price: price,
                    total: itemTotal
                });
            }
        });

        const clientsList = Object.values(customersMap);
        document.getElementById("totalCustomersBadge").textContent = `${clientsList.length} покупців`;

        let tableHtml = "";
        let index = 0;

        // 2. ГЕНЕРАЦІЯ ІНТЕРФЕЙСУ
        clientsList.forEach(client => {
            index++;
            const groupId = `user-drill-${index}`;
            const spent = client.totalSpent;
            const ordersArray = Object.values(client.orders);
            const ordersCount = ordersArray.length;

            // Сегментація лояльності (RFM)
            let segmentLabel = "Пасивний";
            let segmentClass = "bg-red-50 text-red-700 border-red-200";
            if (spent > 50000) {
                segmentLabel = "VIP Клієнт"; segmentClass = "bg-amber-50 text-amber-700 border-amber-200 font-black";
            } else if (spent >= 10000) {
                segmentLabel = "Постійний"; segmentClass = "bg-blue-50 text-blue-700 border-blue-200 font-bold";
            } else if (spent > 0) {
                segmentLabel = "Новачок"; segmentClass = "bg-gray-100 text-gray-700 border-gray-200";
            }

            // РЯДОК 1: КЛІЄНТ
            tableHtml += `
                <tr onclick="toggleCustomerDetails('${groupId}')" class="hover:bg-blue-50/40 border-b border-gray-100 transition-colors cursor-pointer select-none font-medium text-gray-900">
                    <td class="py-4 px-6 flex items-center gap-3">
                        <i data-lucide="chevron-right" id="arrow-${groupId}" class="w-4 h-4 text-emerald-600 transition-transform duration-200"></i>
                        <div>
                            <div class="font-extrabold text-gray-900 text-sm sm:text-base">${client.fullName}</div>
                            <div class="text-[10px] text-gray-400 font-mono">Системний ID: #${client.id.toString().padStart(4, '0')}</div>
                        </div>
                    </td>
                    <td class="py-4 px-6 text-sm">
                        <div class="text-gray-800 font-semibold">${client.phone}</div>
                        <div class="text-xs text-gray-400">${client.email}</div>
                    </td>
                    <td class="py-4 px-6 text-center font-black text-gray-700 text-sm">${ordersCount} замовл.</td>
                    <td class="py-4 px-6 text-right font-black text-emerald-600 text-sm whitespace-nowrap">${spent.toLocaleString('uk-UA')} ₴</td>
                    <td class="py-4 px-6 text-center">
                        <span class="inline-flex items-center px-2.5 py-1 text-xs border rounded-lg whitespace-nowrap ${segmentClass}">
                            ${segmentLabel}
                        </span>
                    </td>
                </tr>
            `;

            // РЯДОК 2: DRILL-DOWN ПАНЕЛЬ З ОБ'ЄДНАНИМИ ЧЕКАМИ
            let detailsHtml = `
                <div class="p-6 bg-slate-50/50 space-y-5 border-x border-b border-gray-100 shadow-inner">
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 bg-white p-3 rounded-xl border border-gray-200/60 text-xs font-semibold shadow-2xs">
                        <div class="flex items-center gap-1.5 text-gray-400 shrink-0">
                            <i data-lucide="map-pin" class="w-4 h-4 text-red-500"></i>
                            <span>Адреса відвантаження матеріальних цінностей:</span>
                        </div>
                        <span class="text-gray-900 font-black text-sm">${client.address}</span>
                    </div>
            `;

            if (ordersCount === 0) {
                detailsHtml += `
                    <p class="text-gray-400 italic pl-6 flex items-center gap-1 text-xs py-2">
                        <i data-lucide="info" class="w-4 h-4"></i> Користувач зареєстрований, але фінансових операцій у СУБД не зафіксовано.
                    </p>
                `;
            } else {
                detailsHtml += `<div class="space-y-4 pl-2">`;
                
                // Проходимо по кожному унікальному замовленню (ЧЕКУ) клієнта
                ordersArray.forEach(order => {
                    detailsHtml += `
                        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                            
                            <div class="bg-gray-50/80 px-4 py-2.5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                <div class="flex items-center gap-4 font-bold text-gray-700">
                                    <span class="flex items-center gap-1 text-blue-600 font-black">
                                        <i data-lucide="receipt" class="w-4 h-4"></i> ЧЕК №${order.orderId.toString().padStart(5,'0')}
                                    </span>
                                    <span class="text-gray-400 font-normal flex items-center gap-1">
                                        <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${order.date}
                                    </span>
                                </div>
                                <div class="text-right sm:text-right font-black text-gray-900">
                                    Разом за чеком: <span class="text-emerald-600 text-sm font-mono">${order.orderTotalSum.toLocaleString('uk-UA')} ₴</span>
                                </div>
                            </div>
                            
                            <div class="divide-y divide-gray-100 bg-white">
                                ${order.items.map(p => `
                                    <div class="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-medium hover:bg-gray-50/30 transition-colors">
                                        <div class="flex items-center gap-2 min-w-0 flex-1">
                                            <i data-lucide="shopping-cart" class="w-3.5 h-3.5 text-gray-400 shrink-0"></i>
                                            <span class="text-gray-900 font-bold truncate">${p.product}</span>
                                        </div>
                                        <div class="flex items-center gap-4 shrink-0 justify-between sm:justify-end w-full sm:w-auto text-gray-600 text-right font-mono">
                                            <span>${p.price.toLocaleString('uk-UA')} ₴ × ${p.qty} шт.</span>
                                            <span class="text-gray-900 font-bold">= ${p.total.toLocaleString('uk-UA')} ₴</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                });
                
                detailsHtml += `</div>`;
            }
            detailsHtml += `</div>`;

            tableHtml += `
                <tr class="${groupId} hidden no-print-break">
                    <td colspan="5" class="p-0 border-none bg-gray-50/20">
                        ${detailsHtml}
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = tableHtml;

        // --- МАТЕМАТИЧНИЙ ПРОРАХУНОК МАРКЕТИНГОВИХ KPI У КАРТКАХ ЗВЕРХУ ---
        let globalSpentSum = 0;
        let globalOrdersSum = 0;
        let passiveCustomersCount = 0;

        clientsList.forEach(c => {
            globalSpentSum += c.totalSpent;
            globalOrdersSum += Object.keys(c.orders).length; // Кількість унікальних замовлень
            if (Object.keys(c.orders).length === 0) {
                passiveCustomersCount++;
            }
        });

        const averageOrderValue = globalOrdersSum > 0 ? (globalSpentSum / globalOrdersSum) : 0;
        const passiveRate = clientsList.length > 0 ? ((passiveCustomersCount / clientsList.length) * 100) : 0;

        document.getElementById("kpiTotalSpent").textContent = `${globalSpentSum.toLocaleString('uk-UA')} ₴`;
        document.getElementById("kpiAverageOrder").textContent = `${Math.round(averageOrderValue).toLocaleString('uk-UA')} ₴`;
        document.getElementById("kpiTotalOrders").textContent = `${globalOrdersSum} замовл.`;
        document.getElementById("kpiPassiveRate").textContent = `${passiveRate.toFixed(1)}%`;

        if (window.lucide) lucide.createIcons();

    } catch (error) {
        console.error("Помилка:", error);
        if (typeof showToast === 'function') showToast("Не вдалося завантажити аналітику!", "error");
    }
}

function toggleCustomerDetails(groupId) {
    const rows = document.querySelectorAll(`.${groupId}`);
    const arrow = document.getElementById(`arrow-${groupId}`);

    rows.forEach(row => row.classList.toggle('hidden'));
    if (arrow) arrow.classList.toggle('rotate-90');
}

function setAllTimePeriod() {
    const fromInput = document.getElementById("crmDateFrom");
    const toInput = document.getElementById("crmDateTo");

    if (fromInput && toInput) {
        // Ставимо початком 2020 рік
        fromInput.value = "2020-01-01";
        
        // Кінцем динамічно виставляємо сьогоднішній день
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        toInput.value = `${yyyy}-${mm}-${dd}`;
        
        // Виводимо інформаційне повідомлення клієнту
        if (typeof showToast === 'function') {
            showToast("Встановлено повний період синхронізації бази", "info");
        }
        
        // Автоматично викликаємо оновлення таблиці з новими датами
        generateCustomerReport();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    generateCustomerReport();
});