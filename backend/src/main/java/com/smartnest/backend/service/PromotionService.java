package com.smartnest.backend.service;

import com.smartnest.backend.dto.CreatePromotionRequest;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.PromotionRepository;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private static final int TITLE_MAX_LENGTH = 255;
    private static final int DISCOUNT_DETAILS_MAX_LENGTH = 1000;
    private static final int MAX_DURATION_YEARS = 2;
    private static final int MAX_DISCOUNT_PERCENTAGE = 100;

    private final PromotionRepository promotionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public Promotion createPromotion(CreatePromotionRequest request, Long actorId) {
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
        Promotion saved = promotionRepository.save(promotion);
        notificationService.promotionSubmitted(saved, actorId, false);
        return withCreatorName(saved);
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
        if (request.getDiscountPercentage().compareTo(java.math.BigDecimal.valueOf(MAX_DISCOUNT_PERCENTAGE)) > 0) {
            throw new IllegalArgumentException("Discount percentage cannot exceed " + MAX_DISCOUNT_PERCENTAGE + "%");
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

    public Promotion approvePromotion(Long promotionId, Long operationsManagerId, Long actorId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + promotionId));
        promotion.setStatus(PromotionStatus.APPROVED);
        promotion.setReviewedByManagerId(operationsManagerId);
        promotion.setRejectionReason(null);
        promotion.setReviewedAt(LocalDateTime.now());
        Promotion saved = promotionRepository.save(promotion);
        notificationService.promotionApproved(saved, actorId);
        return withCreatorName(saved);
    }

    public Promotion rejectPromotion(Long promotionId, Long operationsManagerId, String reason, Long actorId) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A rejection reason is required");
        }
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found: " + promotionId));
        promotion.setStatus(PromotionStatus.REJECTED);
        promotion.setReviewedByManagerId(operationsManagerId);
        promotion.setRejectionReason(reason);
        promotion.setReviewedAt(LocalDateTime.now());
        Promotion saved = promotionRepository.save(promotion);
        notificationService.promotionRejected(saved, actorId);
        return withCreatorName(saved);
    }

    public List<Promotion> getActivePromotions() {
        return withCreatorNames(promotionRepository.findByStatus(PromotionStatus.APPROVED));
    }

    public List<Promotion> getPendingPromotions() {
        return withCreatorNames(promotionRepository.findByStatus(PromotionStatus.PENDING));
    }

    public List<Promotion> getMyPromotions(Long salesStaffId) {
        return withCreatorNames(promotionRepository.findBySalesStaffId(salesStaffId));
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
        promotion.setReviewedAt(null);
        Promotion saved = promotionRepository.save(promotion);
        notificationService.promotionSubmitted(saved, callerId, true);
        return withCreatorName(saved);
    }

    private Promotion withCreatorName(Promotion promotion) {
        return withCreatorNames(List.of(promotion)).get(0);
    }

    // one query for every creator in the list, rather than one per promotion
    private List<Promotion> withCreatorNames(List<Promotion> promotions) {
        List<Long> ids = promotions.stream()
                .map(Promotion::getSalesStaffId).filter(Objects::nonNull).distinct().toList();
        Map<Long, User> users = userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getUserId, Function.identity()));
        for (Promotion p : promotions) {
            User u = users.get(p.getSalesStaffId());
            p.setCreatorName(u == null ? null : (u.getFirstName() + " " + u.getLastName()).trim());
        }
        return promotions;
    }
}
