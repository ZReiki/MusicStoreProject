// Автоматично створюємо контейнер для сповіщень у правому верхньому кутку екрана при завантаженні
(function initToastContainer() {
    if (document.getElementById('toast-container')) return;

    const container = document.createElement('div');
    container.id = 'toast-container';
    // Позиціонування: фіксовано справа вгорі, поверх усіх елементів (z-50)
    container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none';
    document.body.appendChild(container);
})();

/**
 * Глобальна функція для виклику гарного сповіщення
 * @param {string} message - Текст сповіщення
 * @param {string} type - Тип: 'success' (зелений), 'error' (червоний), 'info' (синій)
 * @param {number} duration - Час показу в мілісекундах (за замовчуванням 4 секунди)
 */
function showToast(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Створюємо елемент сповіщення
    const toast = document.createElement('div');
    
    // Налаштування стилів та кольорів залежно від типу події за допомогою TailwindCSS
    let bgClass = 'bg-green-600';
    let iconName = 'check-circle';

    if (type === 'error') {
        bgClass = 'bg-red-600';
        iconName = 'alert-circle';
    } else if (type === 'info') {
        bgClass = 'bg-blue-600';
        iconName = 'info';
    }

    // Базові класи для гарної плавної анімації та тіней
    toast.className = `flex items-center gap-3 ${bgClass} text-white px-4 py-3 rounded-xl shadow-lg transform translate-x-full opacity-0 transition-all duration-300 pointer-events-auto cursor-pointer`;
    
    // Внутрішня HTML-структура з іконкою Lucide
    toast.innerHTML = `
        <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
        <p class="text-sm font-medium flex-1">${message}</p>
        <button class="text-white/70 hover:text-white transition-colors text-xs font-bold pl-2 outline-none">✕</button>
    `;

    // Додаємо в контейнер
    container.appendChild(toast);

    // Ініціалізуємо нову іконку через Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    // Запускаємо анімацію появи (зрушення та проявлення)
    requestAnimationFrame(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
    });

    // Функція для плавного видалення елемента
    const removeToast = () => {
        toast.classList.add('translate-x-full', 'opacity-0');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    };

    // Закриття при кліку на хрестик або на саме сповіщення
    toast.addEventListener('click', removeToast);

    // Автоматичне видалення через заданий проміжок часу
    setTimeout(removeToast, duration);
}