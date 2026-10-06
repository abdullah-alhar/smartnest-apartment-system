package com.smartnest.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromotionSummaryResponse {
    private Long promotionId;
    private String title;
    private String discountDetails;
    private BigDecimal discountPercentage;
    private LocalDate startDate;
    private LocalDate endDate;
    private long daysLeft;
}
