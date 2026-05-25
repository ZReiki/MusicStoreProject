package models;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Keyboards extends Product{
    private String type;
    private int polyphony;
    private int numberOfKeys;
    private boolean keySensetivity;
}
