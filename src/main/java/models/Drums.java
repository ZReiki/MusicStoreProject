package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Drums extends Product {
    private String type;
    private String configuration;
    private String bodyMaterial;
}
