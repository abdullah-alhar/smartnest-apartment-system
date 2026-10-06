// DESIGN PATTERN: Singleton (Creational) - Spring creates only ONE PricingService and shares it everywhere

package com.smartnest.backend.service;

import com.smartnest.backend.dto.PromotionSummaryResponse;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.repository.PromotionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PricingService {

    private static final BigDecimal ADVANCE_RATE = new BigDecimal("0.10");

    private final PromotionRepository promotionRepository;

    public Map<Long, Promotion> activePromotionsFor(Collection<Long> apartmentIds) {
        Map<Long, Promotion> best = new HashMap<>();
        if (apartmentIds == null || apartmentIds.isEmpty()) return best;
        Comparator<Promotion> byDiscountThenLaterEndThenId = Comparator
                .comparing(Promotion::getDiscountPercentage)
                .thenComparing(Promotion::getEndDate)
                .thenComparing(Promotion::getId, Comparator.reverseOrder());
        for (Promotion p : promotionRepository.findActiveForApartments(apartmentIds, LocalDate.now())) {
            best.merge(p.getApartmentId(), p, (a, b) -> byDiscountThenLaterEndThenId.compare(a, b) >= 0 ? a : b);
        }
        return best;
    }

    public BigDecimal discountedPrice(BigDecimal price, BigDecimal discountPercentage) {
        BigDecimal factor = BigDecimal.ONE.subtract(discountPercentage.divide(BigDecimal.valueOf(100)));
        return price.multiply(factor).setScale(2, RoundingMode.HALF_UP);
    }

    public BigDecimal advancePayment(BigDecimal payablePrice) {
        return payablePrice.multiply(ADVANCE_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    public PromotionSummaryResponse summarize(Promotion promotion) {
        return PromotionSummaryResponse.builder()
                .promotionId(promotion.getId())
                .title(promotion.getTitle())
                .discountDetails(promotion.getDiscountDetails())
                .discountPercentage(promotion.getDiscountPercentage())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .daysLeft(Math.max(0, ChronoUnit.DAYS.between(LocalDate.now(), promotion.getEndDate())))
                .build();
    }
}
