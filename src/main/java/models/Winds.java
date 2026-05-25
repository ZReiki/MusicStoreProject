package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Winds extends Product{
    private String type;
    private String material;
    private String scaleRange;
}