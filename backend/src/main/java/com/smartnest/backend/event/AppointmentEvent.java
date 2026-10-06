// DESIGN PATTERN: Observer (Behavioral) - the event (message) the Subject AppointmentService sends to its Observers

package com.smartnest.backend.event;

import com.smartnest.backend.model.Appointment;

/** Published by AppointmentService whenever a site visit changes. */
public record AppointmentEvent(Action action, Appointment appointment) implements SmartNestEvent {

    public enum Action { REQUESTED, CHANGED, CANCELLED, APPROVED, RESCHEDULED, DECLINED, COMPLETED }

    @Override
    public String summary() {
        return "Appointment #" + appointment.getAppointmentId() + " " + action;
    }
}
