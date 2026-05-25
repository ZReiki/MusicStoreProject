package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Guitars extends Product {
    private String type;
    private String neckMaterial;
    private String bodyMaterial;
    private int numberOfFrets;
    private int numberOfStrings;
    private String pickupType;
}
