package com.smartnest.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "apartments")
@Data
@NoArgsConstructor
public class Apartment {

    @Id
    @NextId
    private Long apartmentId;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer roomCount;

    @Column(nullable = false)
    private Double size;

    @Embedded
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ListingStatus listingStatus = ListingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;

    @Column(nullable = false)
    private LocalDate listedDate;

    private Long createdByStaffId;

    private String rejectionReason;

    private Long reviewedByManagerId;

    private LocalDateTime reviewedAt;

    /** Relative path of the apartment's photo under the upload folder, or null when there is none. */
    @JsonIgnore
    private String imagePath;

    @Transient
    @JsonProperty("imageUrl")
    public String getImageUrl() { return ApartmentImages.urlFor(imagePath); }

    @Transient
    private String createdByName;

    @Transient
    private BigDecimal discountedPrice;

    @Transient
    private BigDecimal activeDiscountPercentage;

    @PrePersist
    void onCreate() {
        if (listedDate == null) {
            listedDate = LocalDate.now();
        }
    }

    @Transient
    public long getDaysListed() {
        return listedDate == null ? 0 : ChronoUnit.DAYS.between(listedDate, LocalDate.now());
    }
}
