// DESIGN PATTERN: Observer (Behavioral) - the event (message) the Subject ReservationService sends to its Observers

package com.smartnest.backend.event;

import com.smartnest.backend.model.Reservation;

/** Published by ReservationService whenever a reservation changes. */
public record ReservationEvent(Action action, Reservation reservation) implements SmartNestEvent {

    public enum Action { SUBMITTED, PROOF_UPLOADED, CHANGED, CANCELLED, APPROVED, REJECTED }

    @Override
    public String summary() {
        return "Reservation #" + reservation.getReservationId() + " " + action;
    }
}
