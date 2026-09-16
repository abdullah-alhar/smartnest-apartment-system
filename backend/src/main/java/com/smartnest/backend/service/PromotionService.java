package com.smartnest.backend.service;

import com.smartnest.backend.dto.CreatePromotionRequest;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import com.smartnest.backend.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private static final int TITLE_MAX_LENGTH = 255;
    private static final int DISCOUNT_DETAILS_MAX_LENGTH = 1000;
    private static final int MAX_DURATION_YEARS = 2;

    private final PromotionRepository promotionRepository;

    public Promotion createPromotion(CreatePromotionRequest request) {
        validate(request);

        Promotion promotion = new Promotion();
        promotion.setApartmentId(request.getApartmentId());
        promotion.setSalesStaffId(request.getSalesStaffId());
        promotion.setTitle(request.getTitle());
        promotion.setDiscountDetails(request.getDiscountDetails());
        promotion.setDiscountPercentage(request.getDiscountPercentage());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setFeatured(request.isFeatured());
        promotion.setStatus(PromotionStatus.PENDING);
        return promotionRepository.save(promotion);
    }

    // frontend checks these too, but never trust the client alone
    private void validate(CreatePromotionRequest request) {
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new IllegalArgumentException("Promotion title is required");
        }
        // matches Promotion.title's column length so we fail clean instead of a DB truncation error
        if (request.getTitle().length() > TITLE_MAX_LENGTH) {
            throw new IllegalArgumentException("Promotion title cannot exceed " + TITLE_MAX_LENGTH + " characters");
        }
        if (request.getDiscountDetails() != null && request.getDiscountDetails().length() > DISCOUNT_DETAILS_MAX_LENGTH) {
            throw new IllegalArgumentException("Discount details cannot exceed " + DISCOUNT_DETAILS_MAX_LENGTH + " characters");
        }
        if (request.getApartmentId() == null) {
            throw new IllegalArgumentException("Apartment ID is required");
        }
        if (request.getSalesStaffId() == null) {
            throw new IllegalArgumentException("Sales staff ID is required");
        }
        if (request.getDiscountPercentage() == null
                || request.getDiscountPercentage().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Discount percentage must be greater than 0");
        }
        if (request.getDiscountPercentage().compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Discount percentage cannot exceed 100");
        }
        if (request.getStartDate() == null) {
            throw new IllegalArgumentException("Start date is required");
        }
        if (request.getStartDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Start date cannot be in the past");
        }
        if (request.getEndDate() == null) {
            throw new IllegalArgumentException("End date is required");
        }
        if (!request.getEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }
        if (request.getEndDate().isAfter(request.getStartDate().plusYears(MAX_DURATION_YEARS))) {
            throw new IllegalArgumentException("A promotion cannot run for more than " + MAX_DURATION_YEARS + " years");
        }
    }

    public Promotion approvePromotion(Long promotionId, Long operationsManagerId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + promotionId));
        promotion.setStatus(PromotionStatus.APPROVED);
        promotion.setReviewedByManagerId(operationsManagerId);
        return promotionRepository.save(promotion);
    }

    public Promotion rejectPromotion(Long promotionId, Long operationsManagerId, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + promotionId));
        promotion.setStatus(PromotionStatus.REJECTED);
        promotion.setReviewedByManagerId(operationsManagerId);
        promotion.setRejectionReason(reason);
        return promotionRepository.save(promotion);
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByStatus(PromotionStatus.APPROVED);
    }

    public List<Promotion> getPendingPromotions() {
        return promotionRepository.findByStatus(PromotionStatus.PENDING);
    }

    public List<Promotion> getMyPromotions(Long salesStaffId) {
        return promotionRepository.findBySalesStaffId(salesStaffId);
    }

    public void deletePromotion(Long promotionId, Long callerId, boolean isAdmin) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + promotionId));
        if (!isAdmin && !promotion.getSalesStaffId().equals(callerId)) {
            throw new AccessDeniedException("You can only delete your own promotions");
        }
        promotionRepository.delete(promotion);
    }

    // used to edit-and-resubmit a rejected (or any owned) promotion — always resets it back to PENDING review
    public Promotion updatePromotion(Long promotionId, CreatePromotionRequest request, Long callerId, boolean isAdmin) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + promotionId));
        if (!isAdmin && !promotion.getSalesStaffId().equals(callerId)) {
            throw new AccessDeniedException("You can only edit your own promotions");
        }
        validate(request);

        promotion.setApartmentId(request.getApartmentId());
        promotion.setTitle(request.getTitle());
        promotion.setDiscountDetails(request.getDiscountDetails());
        promotion.setDiscountPercentage(request.getDiscountPercentage());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());
        promotion.setFeatured(request.isFeatured());
        promotion.setStatus(PromotionStatus.PENDING);
        promotion.setRejectionReason(null);
        promotion.setReviewedByManagerId(null);
        return promotionRepository.save(promotion);
    }
}
