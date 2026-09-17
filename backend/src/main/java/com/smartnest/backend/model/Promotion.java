package com.smartnest.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "promotions")
@Data
@NoArgsConstructor
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The apartment this promotion applies to
    private Long apartmentId;

    // The SalesStaff member who submitted the promotion
    private Long salesStaffId;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String discountDetails;

    @Column(nullable = false)
    private BigDecimal discountPercentage;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    // manual accessors + @JsonProperty so the JSON key stays "isFeatured" (Lombok's default would send "featured")
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean isFeatured = false;

    @JsonProperty("isFeatured")
    public boolean isFeatured() {
        return isFeatured;
    }

    @JsonProperty("isFeatured")
    public void setFeatured(boolean isFeatured) {
        this.isFeatured = isFeatured;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PromotionStatus status = PromotionStatus.PENDING;

    // Populated by OperationsManager on rejection
    private String rejectionReason;

    // The OperationsManager who approved or rejected
    private Long reviewedByManagerId;

    // when the approve/reject decision was made — cleared again on resubmission
    private LocalDateTime reviewedAt;

    // not stored — filled in by PromotionService for list responses so the UI can show "Submitted by"
    @Transient
    private String creatorName;
}
