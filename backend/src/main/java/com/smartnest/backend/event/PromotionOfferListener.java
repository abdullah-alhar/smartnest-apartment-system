// DESIGN PATTERN: Observer (Behavioral) - this class is an Observer (listener)

package com.smartnest.backend.event;

import com.smartnest.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer that tells every active customer about a newly approved promotion.
 *
 * This shows why Observer is useful: the feature was added as a new listener,
 * without changing a single line of PromotionService.
 */
@Component
@RequiredArgsConstructor
public class PromotionOfferListener {

    private final NotificationService notificationService;

    @EventListener
    public void onPromotion(PromotionEvent e) {
        if (e.action() == PromotionEvent.Action.APPROVED) {
            notificationService.promotionOfferToCustomers(e.promotion());
        }
    }
}
