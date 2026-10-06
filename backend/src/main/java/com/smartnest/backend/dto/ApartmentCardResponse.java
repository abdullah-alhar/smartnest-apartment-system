package com.smartnest.backend.dto;

import com.smartnest.backend.model.AvailabilityStatus;
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
public class ApartmentCardResponse {
    private Long apartmentId;
    private String title;
    private String city;
    private String street;

    private BigDecimal price;
    private BigDecimal discountedPrice;
    private BigDecimal discountPercentage;

    private Integer roomCount;
    private Double size;

    private AvailabilityStatus availabilityStatus;
    private LocalDate listedDate;
    private Long createdByStaffId;
    private String imageUrl;
}
