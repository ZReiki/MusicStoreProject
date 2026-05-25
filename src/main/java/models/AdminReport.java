package models;

import java.util.List;
import java.util.Map;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AdminReport {
    private int totalProductsInDB;
    private int totalOrdersToday;
    private double monthlyRevenue;
    private List<Map<String, Object>> chartData;    // Для кругової діаграми
    private List<Map<String, Object>> tableData;    // Для детальної таблиці
}