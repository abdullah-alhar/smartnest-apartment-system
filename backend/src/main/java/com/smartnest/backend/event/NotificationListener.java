// DESIGN PATTERN: Observer (Behavioral) - this class is an Observer (listener)

package com.smartnest.backend.event;

import com.smartnest.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Observer that turns events into the in-app notifications shown under the bell.
 *
 * The services (the Subjects) only publish an event; they do not know this class exists.
 * Spring calls the matching method below straight away, in the same thread and transaction,
 * so the result is exactly the same as when the services called NotificationService directly.
 */
@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationService notificationService;

    @EventListener
    public void onPromotion(PromotionEvent e) {
        switch (e.action()) {
            case SUBMITTED -> notificationService.promotionSubmitted(e.promotion(), e.actorId(), false);
            case RESUBMITTED -> notificationService.promotionSubmitted(e.promotion(), e.actorId(), true);
            case APPROVED -> notificationService.promotionApproved(e.promotion(), e.actorId());
            case REJECTED -> notificationService.promotionRejected(e.promotion(), e.actorId());
        }
    }

    @EventListener
    public void onApartment(ApartmentEvent e) {
        switch (e.action()) {
            case SUBMITTED -> notificationService.apartmentSubmitted(e.apartment(), e.actorId(), false);
            case RESUBMITTED -> notificationService.apartmentSubmitted(e.apartment(), e.actorId(), true);
            case APPROVED -> notificationService.apartmentApproved(e.apartment(), e.actorId());
            case REJECTED -> notificationService.apartmentRejected(e.apartment(), e.actorId());
        }
    }

    @EventListener
    public void onInquiry(InquiryEvent e) {
        switch (e.action()) {
            case SUBMITTED -> notificationService.inquirySubmitted(e.inquiry());
            case RESPONDED -> notificationService.inquiryResponded(e.inquiry());
            case CLOSED -> notificationService.inquiryClosed(e.inquiry());
        }
    }

    @EventListener
    public void onAppointment(AppointmentEvent e) {
        switch (e.action()) {
            case REQUESTED -> notificationService.appointmentRequested(e.appointment());
            case CHANGED -> notificationService.appointmentChanged(e.appointment());
            case CANCELLED -> notificationService.appointmentCancelled(e.appointment());
            case APPROVED -> notificationService.appointmentApproved(e.appointment());
            case RESCHEDULED -> notificationService.appointmentRescheduled(e.appointment());
            case DECLINED -> notificationService.appointmentDeclined(e.appointment());
            case COMPLETED -> notificationService.appointmentCompleted(e.appointment());
        }
    }

    @EventListener
    public void onReservation(ReservationEvent e) {
        switch (e.action()) {
            case SUBMITTED -> notificationService.reservationSubmitted(e.reservation());
            case PROOF_UPLOADED -> notificationService.reservationProofUploaded(e.reservation());
            case CHANGED -> notificationService.reservationChanged(e.reservation());
            case CANCELLED -> notificationService.reservationCancelled(e.reservation());
            case APPROVED -> notificationService.reservationApproved(e.reservation());
            case REJECTED -> notificationService.reservationRejected(e.reservation());
        }
    }
}
