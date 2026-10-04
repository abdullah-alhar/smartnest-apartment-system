package com.smartnest.backend.dto;

import com.smartnest.backend.model.Address;
import com.smartnest.backend.model.AvailabilityStatus;
import com.smartnest.backend.model.ListingStatus;
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
public class ApartmentDetailResponse {
    private Long apartmentId;
    private String title;
    private String description;

    private BigDecimal price;
    private BigDecimal discountedPrice;
    private BigDecimal discountPercentage;
    private PromotionSummaryResponse promotion;
    private BigDecimal advancePaymentAmount;

    private Integer roomCount;
    private Double size;

    private Address address;

    private AvailabilityStatus availabilityStatus;
    private ListingStatus listingStatus;
    private String rejectionReason;
    private LocalDate listedDate;
    private long daysListed;
    private Long createdByStaffId;
    private String createdByName;
    private String imageUrl;
}
