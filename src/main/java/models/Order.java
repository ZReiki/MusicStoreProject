package models;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    private int orderId;
    private int customerId;
    private int employeeId;
    private LocalDateTime creationDate;
    private String orderStatus;
    private double shippingCost;
    private String shiipingAddress;
    private String paymentMethod;
    private String orderComment;
    private double totalPrice;
}
