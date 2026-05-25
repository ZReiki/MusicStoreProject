USE musicStore;

-- ============================================================================
-- 1. ДОДАВАННЯ КЛІЄНТІВ
-- ============================================================================
INSERT INTO customers (lastName, firstName, phoneNumber, email, residentialAddress) VALUES
('Іванова', 'Настьона', '+380501112233', 'nastena.love@gmail.com', 'м. Миколаїв, просп. Центральний, 42'),
('Шевченко', 'Андрій', '+380671234567', 'andriy.sh@ukr.net', 'м. Київ, вул. Хрещатик, 15'),
('Коваленко', 'Олена', '+380939876543', 'olenka.kov@gmail.com', 'м. Одеса, вул. Дерибасівська, 8'),
-- Нові клієнти:
('Мельник', 'Богдан', '+380667778899', 'b.melnyk@gmail.com', 'м. Львів, вул. Городоцька, 115'),
('Бойко', 'Софія', '+380975554433', 'sofia.boyko@ukr.net', 'м. Харків, вул. Сумська, 45'),
('Григоренко', 'Василь', '+380632223344', 'vasyl.bass@gmail.com', 'м. Дніпро, просп. Яворницького, 12');

-- ============================================================================
-- 2. ДОДАВАННЯ СПІВРОБІТНИКІВ
-- ============================================================================
INSERT INTO employees (lastName, firstName, middleName, login, position) VALUES
('Федосюк', 'Олександр', 'Олександрович', 'admin@musicstore.ua', 'Старший менеджер'),
('Ткаченко', 'Ігор', 'Миколайович', 'igor.tk@musicstore.ua', 'Касир-консультант'),
-- Нові співробітники:
('Павленко', 'Марія', 'Іванівна', 'maria.p@musicstore.ua', 'Менеджер з онлайн-продажів'),
('Романенко', 'Віталій', 'Сергійович', 'vitaliy.r@musicstore.ua', 'Спеціаліст сервісного центру');

-- ============================================================================
-- 3. ДОДАВАННЯ ПОСТАЧАЛЬНИКІВ
-- ============================================================================
INSERT INTO suppliers (companyName, phoneNumber, address) VALUES
('Yamaha Ukraine Official', '+380441112233', 'м. Київ, вул. Музична, 10'),
('Fender Europe Distribution', '+48123456789', 'Варшава, Польща, вул. Гітарна, 5'),
('Roland Global', '+380509998877', 'м. Львів, Промзона "Південь"'),
-- Нові постачальники:
('Korg Distribution', '+442012345678', 'Лондон, Велика Британія, вул. Синтезаторна, 1'),
('Meinl Percussion', '+4991617880', 'Гутенштеттен, Німеччина, Промзона 3');

-- ============================================================================
-- 4. ДОДАВАННЯ ТОВАРІВ ТА ЇХ СПЕЦИФІКАЦІЙ (ISA HIERARCHY)
-- ============================================================================

-- 4.0.1 Гітара (Електро)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(1, 'Fender Stratocaster Player', 'Guitars', 'Fender', 28500.00, 5, 'New', 'Класична електрогітара серії Player.', 5.0);
INSERT INTO guitars (product_id, `type`, neckMaterial, bodyMaterial, numberOfFrets, numberOfStrings, pickupType) VALUES
(1, 'Електрогітара', 'Клен', 'Вільха', 22, 6, 'SSS - Single Coils');

-- 4.0.2 Клавішні (Цифрове піаніно)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(2, 'Yamaha P-45B', 'Keyboards', 'Yamaha', 19800.00, 3, 'New', 'Компактне цифрове піаніно.', 4.8);
INSERT INTO keyboards (product_id, `type`, polyphony, numberOfKeys, keySensetivity) VALUES
(2, 'Цифрове піаніно', 64, 88, TRUE);

-- 4.0.3 Ударні (Електронні)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(3, 'Roland TD-1DMK', 'Drums', 'Roland', 34000.00, 2, 'Used', 'Електронна ударна установка у відмінному стані.', 4.5);
INSERT INTO drums (product_id, `type`, configuration, bodyMaterial) VALUES
(3, 'Електронна', 'Тарілки х3, Педаль х1, Педи х4', 'Пластик/Метал');

-- 4.0.4 Духові (Саксофон)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(4, 'Yamaha YAS-280', 'Winds', 'Yamaha', 42000.00, 1, 'New', 'Альт-саксофон для початківців та професіоналів.', 5.0);
INSERT INTO winds (product_id, `type`, material, scaleRange) VALUES
(4, 'Саксофон', 'Жовта латунь (золотий лак)', 'Альт');

-- [НОВІ ТОВАРИ] --------------------------------------------------------------

-- 4.0.5 Гітара (Акустична)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(5, 'Cort AD810 OP', 'Guitars', 'Cort', 4500.00, 15, 'New', 'Чудова акустична гітара для початківців.', 4.7);
INSERT INTO guitars (product_id, `type`, neckMaterial, bodyMaterial, numberOfFrets, numberOfStrings, pickupType) VALUES
(5, 'Акустична', 'Червоне дерево', 'Ялина', 20, 6, NULL);

-- 4.0.6 Гітара (Бас)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(6, 'Ibanez SR300E', 'Guitars', 'Ibanez', 16500.00, 4, 'New', 'Сучасна бас-гітара з активною електронікою.', 4.9);
INSERT INTO guitars (product_id, `type`, neckMaterial, bodyMaterial, numberOfFrets, numberOfStrings, pickupType) VALUES
(6, 'Бас-гітара', 'Клен/Горіх', 'Ньято', 24, 4, 'HH - Humbuckers (Active)');

-- 4.0.7 Клавішні (Синтезатор)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(7, 'Korg Minilogue', 'Keyboards', 'Korg', 25000.00, 2, 'New', 'Поліфонічний аналоговий синтезатор.', 4.9);
INSERT INTO keyboards (product_id, `type`, polyphony, numberOfKeys, keySensetivity) VALUES
(7, 'Синтезатор (Аналоговий)', 4, 37, TRUE);

-- 4.0.8 Клавішні (MIDI)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(8, 'Akai MPK Mini Mk3', 'Keyboards', 'Akai', 4200.00, 20, 'New', 'Ультракомпактна MIDI-клавіатура з педами.', 4.8);
INSERT INTO keyboards (product_id, `type`, polyphony, numberOfKeys, keySensetivity) VALUES
(8, 'MIDI-клавіатура', 0, 25, TRUE);

-- 4.0.9 Ударні (Акустичні)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(9, 'Tama Imperialstar', 'Drums', 'Tama', 41500.00, 1, 'New', 'Повноцінна акустична ударна установка зі стійками.', 4.6);
INSERT INTO drums (product_id, `type`, configuration, bodyMaterial) VALUES
(9, 'Акустична', 'Бас-бочка, 3 томи, малий барабан, стійки', 'Тополя');

-- 4.0.10 Духові (Труба)
INSERT INTO products (product_id, productName, category, manufacturer, price, quantity, `condition`, `description`, rating) VALUES
(10, 'Yamaha YTR-2330', 'Winds', 'Yamaha', 22000.00, 3, 'New', 'Студентська труба з відмінним інтонуванням.', 4.9);
INSERT INTO winds (product_id, `type`, material, scaleRange) VALUES
(10, 'Труба', 'Жовта латунь', 'Сопрано');

-- ============================================================================
-- 5. ДОДАВАННЯ ПОСТАВОК
-- ============================================================================
INSERT INTO supplies (supply_id, supplier_id, deliveryDate, totalCost) VALUES
(1, 1, '2026-05-10 10:00:00', 100000.00), -- Від Yamaha
(2, 2, '2026-05-15 14:30:00', 80000.00),  -- Від Fender
-- Нові поставки:
(3, 4, '2026-05-17 11:00:00', 50000.00),  -- Від Korg Distribution
(4, 5, '2026-05-18 09:45:00', 120000.00); -- Від Meinl / інші бренди через дистриб'ютора

-- ============================================================================
-- 6. ДОДАВАННЯ ПОЗИЦІЙ ПОСТАВКИ
-- ============================================================================
INSERT INTO supply_items (supply_id, product_id, purchasePrice, quantity) VALUES
(1, 2, 15000.00, 4), -- Привезли піаніно Yamaha
(1, 4, 35000.00, 1), -- Привезли саксофон Yamaha
(1, 10, 16000.00, 3), -- Привезли труби Yamaha
(2, 1, 20000.00, 4), -- Привезли гітари Fender
(3, 7, 19000.00, 2), -- Привезли Korg Minilogue
(4, 5, 2500.00, 15), -- Привезли акустику Cort
(4, 8, 2800.00, 20), -- Привезли Akai MPK
(4, 9, 32000.00, 1); -- Привезли Tama Imperialstar

-- ============================================================================
-- 7. СТВОРЕННЯ ЗАМОВЛЕНЬ ВІД КЛІЄНТІВ
-- ============================================================================
INSERT INTO orders (order_id, customer_id, employee_id, creationDate, orderStatus, shippingCost, shippingAddress, paymentMethod, orderComment, totalPrice) VALUES
(1, 1, 1, '2026-05-18 12:00:00', 'Completed', 150.00, 'м. Миколаїв, відділення НП №3', 'Картка', 'Обережно, крихке!', 28650.00),
(2, 2, 2, '2026-05-19 09:15:00', 'Shipped', 200.00, 'м. Київ, кур`єрська доставка', 'Готівка', 'Зателефонувати за годину', 19800.00),
-- Нові замовлення:
(3, 4, 3, '2026-05-19 10:05:00', 'Pending', 0.00, 'Самовивіз з магазину', 'Картка', 'Заберу сьогодні ввечері', 4500.00),
(4, 5, 3, '2026-05-19 10:30:00', 'Processing', 100.00, 'м. Харків, відділення НП №12', 'Оплата частинами', 'Потрібна додаткова упаковка', 29200.00),
(5, 6, 1, '2026-05-19 11:00:00', 'Cancelled', 0.00, 'м. Дніпро', 'Картка', 'Скасував, знайшов дешевше', 16500.00);

-- ============================================================================
-- 8. ДОДАВАННЯ ТОВАРІВ У ЗАМОВЛЕННЯ (ЧЕК)
-- ============================================================================
INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unitPrice) VALUES
(1, 1, 1, 1, 28500.00), -- Клієнт 1: Гітара Fender
(2, 2, 2, 1, 19800.00), -- Клієнт 2: Піаніно Yamaha
-- Нові чеки:
(3, 3, 5, 1, 4500.00),  -- Клієнт 4: Акустика Cort
(4, 4, 7, 1, 25000.00), -- Клієнт 5: Синтезатор Korg
(5, 4, 8, 1, 4200.00),  -- Клієнт 5: MIDI-клавіатура Akai
(6, 5, 6, 1, 16500.00); -- Клієнт 6: Бас-гітара Ibanez (Скасовано)

-- ============================================================================
-- 9. ОФОРМЛЕННЯ ПОВЕРНЕННЯ
-- ============================================================================
INSERT INTO returns (return_id, order_item_id, employee_id, reasonForReturn, problemDescription, applicationStatus, reasonForRefusal) VALUES
(1, 2, 1, 'Механічне пошкодження', 'При розпакуванні виявлено глибоку подряпину на корпусі', 'Pending', NULL),
-- Нове повернення (Відмова):
(2, 1, 4, 'Не підійшов товар', 'Гітара виявилась занадто важкою', 'Rejected', 'Товар має сліди активного використання (подряпини на пікгарді), що порушує умови повернення протягом 14 днів.');