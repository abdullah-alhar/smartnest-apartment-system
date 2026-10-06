// DESIGN PATTERN: Observer (Behavioral) - the event (message) the Subject InquiryService sends to its Observers

package com.smartnest.backend.event;

import com.smartnest.backend.model.Inquiry;

/** Published by InquiryService whenever a customer inquiry is submitted, answered or closed. */
public record InquiryEvent(Action action, Inquiry inquiry) implements SmartNestEvent {

    public enum Action { SUBMITTED, RESPONDED, CLOSED }

    @Override
    public String summary() {
        return "Inquiry #" + inquiry.getInquiryId() + " " + action;
    }
}
