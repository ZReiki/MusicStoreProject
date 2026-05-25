package models;

import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Customer {
    private int customerId;
    private String lastName;
    private String firstName;
    private String phoneNumber;
    private String email;
    private String residentialAddress;
}