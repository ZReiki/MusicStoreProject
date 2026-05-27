package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Product {
    protected int productId;
    protected String productName;
    protected String category;
    protected String manufacturer;
    protected double price;
    protected int quantity;
    protected String condition; // Для ENUM ('New', 'Used')
    protected String description;
    protected double rating;
    protected String photo;

    // Перевизначений метод для гарного виводу в консоль
    @Override
    public String toString() {
        return String.format(
            "--------------------------------------------------\n" +
            "ID: %d | [%s] %s\n" +
            "Виробник: %s | Стан: %s\n" +
            "Ціна: %.2f грн | На складі: %d шт.\n" +
            "Рейтинг: %.1f/5.0\n" +
            "Опис: %s\n" +
            "--------------------------------------------------",
            productId, category, productName, manufacturer, condition, price, quantity, rating, description
        );
    }
}
