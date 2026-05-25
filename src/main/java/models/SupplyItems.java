package models;

import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SupplyItems {
    private int supplyId;
    private int productId;
    private double purchasePrice;
    private int quantity;
}
