// DESIGN PATTERN: Observer (Behavioral) - the event (message) the Subject ApartmentService sends to its Observers

package com.smartnest.backend.event;

import com.smartnest.backend.model.Apartment;

/** Published by ApartmentService whenever an apartment listing is submitted or reviewed. */
public record ApartmentEvent(Action action, Apartment apartment, Long actorId) implements SmartNestEvent {

    public enum Action { SUBMITTED, RESUBMITTED, APPROVED, REJECTED }

    @Override
    public String summary() {
        return "Apartment #" + apartment.getApartmentId() + " " + action;
    }
}
