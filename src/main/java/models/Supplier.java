package models;

import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Supplier {
    private int supplierId;
    private String companyName;
    private String phoneNumber;
    private String address;
}
