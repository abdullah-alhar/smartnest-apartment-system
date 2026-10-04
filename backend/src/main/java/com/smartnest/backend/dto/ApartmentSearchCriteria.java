package com.smartnest.backend.dto;

import com.smartnest.backend.model.AvailabilityStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApartmentSearchCriteria {
    private String keyword;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private AvailabilityStatus status;
    private Boolean withPromotion;
    private String sort;
    private int page = 0;
    private int size = 9;
}
