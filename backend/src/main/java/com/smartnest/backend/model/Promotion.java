package com.smartnest.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "promotions")
@Data
@NoArgsConstructor
public class Promotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long promotionId;

    private Long apartmentId;

    private Long salesStaffId;

    private Long operationsManagerId;

    @Column(nullable = false)
    private String title;

    private String discountDetails;

    private Double discountPercentage;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    private PromotionStatus status;

    private boolean isFeatured;

    private String rejectionReason;
}