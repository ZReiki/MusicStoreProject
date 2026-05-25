/* Сценарій створення бази даних для інформаційної системи магазину музичних інструментів "MusicStore"*/

CREATE DATABASE IF NOT EXISTS musicStore;
USE musicStore;

-- ============================================================================
-- 1. ТАБЛИЦЯ: КЛІЄНТИ (CUSTOMERS)
-- Зберігає персональні та контактні дані покупців
-- ============================================================================
CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY, -- Унікальний ідентифікатор (Первинний ключ)
    lastName VARCHAR(100) NOT NULL,              -- Прізвище
    firstName VARCHAR(100) NOT NULL,             -- Ім'я
    phoneNumber VARCHAR(20),                     -- Контактний номер телефону
    email VARCHAR(100) UNIQUE NOT NULL,          -- Унікальна адреса пошти (для входу/сповіщень)
    residentialAddress VARCHAR(255)              -- Адреса проживання (для доставки)
);

-- ============================================================================
-- 2. ТАБЛИЦЯ: СПІВРОБІТНИКИ (EMPLOYEES)
-- Зберігає дані персоналу, що обслуговує замовлення та повернення
-- ============================================================================
CREATE TABLE employees (
    employee_id INT AUTO_INCREMENT PRIMARY KEY, -- Унікальний ідентифікатор співробітника
    lastName VARCHAR(100) NOT NULL,              -- Прізвище
    firstName VARCHAR(100) NOT NULL,             -- Ім'я
    middleName VARCHAR(100),                     -- По батькові
    login VARCHAR(100) NOT NULL UNIQUE,          -- Логін для доступу до системи
    position VARCHAR(100)                        -- Посада (менеджер, касир тощо)
);

-- ============================================================================
-- 3. ТАБЛИЦЯ: ПОСТАЧАЛЬНИКИ (SUPPLIERS)
-- Зберігає дані про компанії, що постачають товар у магазин
-- ============================================================================
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY, -- Код постачальника
    companyName VARCHAR(255) NOT NULL,           -- Назва компанії
    phoneNumber VARCHAR(20),                     -- Телефон компанії
    address VARCHAR(255)                         -- Юридична адреса
);

-- ============================================================================
-- 4. ТАБЛИЦЯ: ТОВАРИ (PRODUCTS) - Базова таблиця ієрархії ISA
-- Містить загальні атрибути, притаманні всім видам інструментів
-- ============================================================================
CREATE TABLE products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,   -- Код товару
    productName VARCHAR(255) NOT NULL,           -- Назва інструменту (модель)
    category VARCHAR(100) NOT NULL,              -- Категорія (Гітара, Барабани тощо)
    manufacturer VARCHAR(100) NOT NULL,          -- Виробник (бренд)
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Поточна ціна в магазині
    quantity INT NOT NULL DEFAULT 0,             -- Залишок на складі (в штуках)
    `condition` ENUM('New', 'Used') DEFAULT 'New', -- Стан: новий або вживаний
    `description` TEXT,                          -- Детальний технічний опис
    rating DECIMAL(2, 1) DEFAULT 0.0,            -- Середній рейтинг за відгуками
    photo VARCHAR(255)                           -- Посилання або назва файлу зображення
);

-- ============================================================================
-- СПЕЦІАЛІЗОВАНІ ТАБЛИЦІ (ISA HIERARCHY)
-- Кожна таблиця маєproduct_id, який є одночасно PK та FK на таблицю products (Зв'язок 1:1)
-- ============================================================================

-- 4.1 Клавішні інструменти
CREATE TABLE keyboards (
    product_id INT PRIMARY KEY,
    `type` VARCHAR(100),      -- Тип (цифрове піаніно, синтезатор)
    polyphony INT,            -- Кількість голосів поліфонії
    numberOfKeys INT,         -- Кількість клавіш
    keySensetivity BOOLEAN,   -- Наявність чутливості до натискання (Так/Ні)
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 4.2 Ударні інструменти
CREATE TABLE drums (
    product_id INT PRIMARY KEY,
    `type` VARCHAR(100),      -- Тип (акустична або електронна установка)
    configuration VARCHAR(255), -- Комплектація (кількість тарілок, педалі)
    bodyMaterial VARCHAR(100), -- Матеріал корпусу (дерево, пластик)
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 4.3 Духові інструменти
CREATE TABLE winds (
    product_id INT PRIMARY KEY,
    `type` VARCHAR(100),      -- Тип (саксофон, труба, флейта)
    material VARCHAR(100),    -- Матеріал покриття (лак, срібло)
    scaleRange VARCHAR(100),  -- Діапазон октав
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- 4.4 Гітари
CREATE TABLE guitars (
    product_id INT PRIMARY KEY,
    `type` VARCHAR(100),      -- Тип (електро, акустика, бас)
    neckMaterial VARCHAR(100), -- Матеріал грифа
    bodyMaterial VARCHAR(100), -- Матеріал деки
    numberOfFrets INT,        -- Кількість ладів
    numberOfStrings INT,      -- Кількість струн
    pickupType VARCHAR(100),  -- Тип звукознімачів (для електрогітар)
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

-- ============================================================================
-- 5. ТАБЛИЦЯ: ПОСТАВКИ (SUPPLIES)
-- Фіксує факт отримання партії товару від постачальника
-- ============================================================================
CREATE TABLE supplies (
    supply_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,                  -- Зв'язок із постачальником
    deliveryDate DATETIME DEFAULT CURRENT_TIMESTAMP, -- Дата та час поставки
    totalCost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,  -- Загальна вартість партії
    FOREIGN KEY (supplier_id) REFERENCES suppliers (supplier_id) ON DELETE RESTRICT
);

-- ============================================================================
-- 6. ТАБЛИЦЯ: СКЛАД ПОСТАВКИ (SUPPLY ITEMS)
-- Реалізує зв'язок M:N між поставкою та товаром (що саме приїхало)
-- ============================================================================
CREATE TABLE supply_items (
    supply_id INT NOT NULL,
    product_id INT NOT NULL,
    purchasePrice DECIMAL(10, 2) NOT NULL, -- Ціна закупівлі на момент поставки
    quantity INT NOT NULL CHECK (quantity > 0), -- Кількість одиниць товару
    PRIMARY KEY (supply_id, product_id),    -- Складений первинний ключ
    FOREIGN KEY (supply_id) REFERENCES supplies(supply_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

-- ============================================================================
-- 7. ТАБЛИЦЯ: ЗАМОВЛЕННЯ (ORDERS)
-- Зберігає загальну інформацію про покупку клієнта
-- ============================================================================
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,               -- Хто купив
    employee_id INT,                        -- Хто обробив замовлення
    creationDate DATETIME DEFAULT CURRENT_TIMESTAMP, -- Дата створення
    orderStatus ENUM('Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled') DEFAULT 'Pending',
    shippingCost DECIMAL(10, 2) DEFAULT 0.00, -- Вартість доставки
    shippingAddress VARCHAR(255),           -- Адреса, куди доставити
    paymentMethod VARCHAR(50),              -- Спосіб оплати (картка, готівка)
    orderComment TEXT,                      -- Коментар від покупця
    totalPrice DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- Загальна сума до сплати
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
);

-- ============================================================================
-- 8. ТАБЛИЦЯ: ПОЗИЦІЇ ЗАМОВЛЕННЯ (ORDER ITEMS)
-- Перелік товарів у конкретному чеку (реалізація асоціативної сутності)
-- ============================================================================
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY, -- Унікальний код рядка в чеку
    order_id INT NOT NULL,                        -- Посилання на замовлення
    product_id INT NOT NULL,                     -- Посилання на товар
    quantity INT NOT NULL CHECK (quantity > 0),   -- Скільки штук куплено
    unitPrice DECIMAL(10, 2) NOT NULL,            -- Ціна продажу за 1 шт.
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT
);

-- ============================================================================
-- 9. ТАБЛИЦЯ: ПОВЕРНЕННЯ (RETURNS)
-- Фіксує повернення конкретного товару з чеку
-- ============================================================================
CREATE TABLE returns (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    order_item_id INT NOT NULL,             -- Посилання на конкретну позицію в чеку
    employee_id INT NOT NULL,               -- Співробітник, що прийняв повернення
    reasonForReturn VARCHAR(255),           -- Причина (брак, передумав тощо)
    problemDescription TEXT,                -- Детальний опис несправності
    applicationStatus ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
    reasonForRefusal TEXT,                  -- Причина відмови у поверненні
    photo VARCHAR(255),                     -- Фото докази несправності
    FOREIGN KEY (order_item_id) REFERENCES order_items(order_item_id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT
);