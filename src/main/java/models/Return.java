package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Return {
    private int returnId;
    private int orderItemId;
    private int employeeId;
    private String reasonForReturn;
    private String problemDescription;
    private String applicationStatus;
    private String reasonForRefusal;
    private String photo;
}
