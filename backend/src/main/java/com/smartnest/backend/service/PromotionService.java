package com.smartnest.backend.service;

import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.PromotionStatus;
import com.smartnest.backend.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PromotionService {

    private final PromotionRepository promotionRepository;

    public Promotion createPromotion(Promotion promotion) {
        if (promotion.getDiscountPercentage() == null || promotion.getDiscountPercentage() <= 0) {
            throw new IllegalArgumentException("Discount percentage must be positive");
        }
        if (promotion.getEndDate().isBefore(promotion.getStartDate())) {
            throw new IllegalArgumentException("End date must be after start date");
        }

        promotion.setStatus(PromotionStatus.PENDING);
        return promotionRepository.save(promotion);
    }

    public Promotion approvePromotion(Long promotionId, Long operationsManagerId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found"));

        promotion.setStatus(PromotionStatus.APPROVED);
        promotion.setOperationsManagerId(operationsManagerId);
        return promotionRepository.save(promotion);
    }

    public Promotion rejectPromotion(Long promotionId, Long operationsManagerId, String reason) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new IllegalArgumentException("Promotion not found"));

        promotion.setStatus(PromotionStatus.REJECTED);
        promotion.setOperationsManagerId(operationsManagerId);
        promotion.setRejectionReason(reason);
        return promotionRepository.save(promotion);
    }

    public List<Promotion> getActivePromotions() {
        return promotionRepository.findByStatus(PromotionStatus.APPROVED);
    }

    public List<Promotion> getMyPromotions(Long salesStaffId) {
        return promotionRepository.findBySalesStaffId(salesStaffId);
    }
}