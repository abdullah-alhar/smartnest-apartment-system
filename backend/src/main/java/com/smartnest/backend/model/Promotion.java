package com.smartnest.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    @NextId
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = false)
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private Apartment apartment;

    @JsonIgnore
    public Apartment getApartment() {
        return apartment;
    }

    public void setApartment(Apartment apartment) {
        this.apartment = apartment;
    }

    @Transient
    @JsonProperty("apartmentId")
    public Long getApartmentId() {
        return apartment != null ? apartment.getApartmentId() : null;
    }

    @Transient
    private String apartmentTitle;

    @Transient
    private BigDecimal apartmentPrice;

    @Transient
    private BigDecimal discountedPrice;

    @Transient
    private String apartmentImageUrl;

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

    private String rejectionReason;

    private Long reviewedByManagerId;

    private LocalDateTime reviewedAt;

    @Transient
    private String creatorName;
}
