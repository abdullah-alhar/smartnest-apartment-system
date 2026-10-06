// DESIGN PATTERN: Observer (Behavioral) - the event (message) the Subject PromotionService sends to its Observers

package com.smartnest.backend.event;

import com.smartnest.backend.model.Promotion;

/** Published by PromotionService whenever something happens to a promotion. */
public record PromotionEvent(Action action, Promotion promotion, Long actorId) implements SmartNestEvent {

    public enum Action { SUBMITTED, RESUBMITTED, APPROVED, REJECTED }

    @Override
    public String summary() {
        return "Promotion #" + promotion.getId() + " " + action;
    }
}
