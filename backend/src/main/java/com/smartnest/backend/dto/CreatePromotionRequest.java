package com.smartnest.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreatePromotionRequest {
    private Long apartmentId;
    private Long salesStaffId;
    private String title;
    private String discountDetails;
    private BigDecimal discountPercentage;
    private LocalDate startDate;
    private LocalDate endDate;

    // See Promotion.isFeatured for why the accessors are overridden this way.
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean isFeatured;

    @JsonProperty("isFeatured")
    public boolean isFeatured() {
        return isFeatured;
    }

    @JsonProperty("isFeatured")
    public void setFeatured(boolean isFeatured) {
        this.isFeatured = isFeatured;
    }
}
