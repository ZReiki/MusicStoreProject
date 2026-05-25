package models;

import lombok.*;
import java.time.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Supply {
    private int supplyId;   // PK
    private int supplierId; // FK
    private LocalDateTime deliveryDate;
    private double totalCost;
}
