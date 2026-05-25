package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    private int employeeId;
    private String lastName;
    private String firstName;
    private String middleName;
    private String login;
    private String position;    // Посада
}
