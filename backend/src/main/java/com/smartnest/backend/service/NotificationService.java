package com.smartnest.backend.service;

import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.Appointment;
import com.smartnest.backend.model.Inquiry;
import com.smartnest.backend.model.Notification;
import com.smartnest.backend.model.NotificationType;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.Reservation;
import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.NotificationRepository;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Creates the in-app notifications shown under the bell.
 *
 * Who is told what:
 *  - Staff queues: the role that handles the item (Operations Manager for listings, promotions and
 *    reservations; CRO for inquiries and site visits) and every Admin, since Admins can act on all of them.
 *  - Customers: every decision about their own reservation, site visit or inquiry.
 *  - Nobody is notified about their own action.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String PROMOTION = "PROMOTION";
    private static final String APARTMENT = "APARTMENT";
    private static final String INQUIRY = "INQUIRY";
    private static final String APPOINTMENT = "APPOINTMENT";
    private static final String RESERVATION = "RESERVATION";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /* ---------- Reading ---------- */

    public List<Notification> listFor(Long userId) {
        return notificationRepository.findByUserIdOrderBySentDateDesc(userId);
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public Notification markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        if (!n.isRead()) {
            n.setRead(true);
            n = notificationRepository.save(n);
        }
        return n;
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllReadForUser(userId);
    }

    /* ---------- Promotions ---------- */

    public void promotionSubmitted(Promotion promotion, Long actorId, boolean resubmitted) {
        notifyStaff(Role.OPERATIONS_MANAGER, actorId,
                resubmitted ? "A promotion was resubmitted for your review." : "A new promotion was submitted for your review.",
                NotificationType.SUBMITTED, PROMOTION, promotion.getId(), promotion.getTitle(), null);
    }

    public void promotionApproved(Promotion promotion, Long actorId) {
        notifyUser(promotion.getSalesStaffId(), actorId, "Your promotion was approved and is now publicly visible.",
                NotificationType.APPROVED, PROMOTION, promotion.getId(), promotion.getTitle(), null);
    }

    public void promotionRejected(Promotion promotion, Long actorId) {
        notifyUser(promotion.getSalesStaffId(), actorId, "Your promotion was rejected and returned for changes.",
                NotificationType.REJECTED, PROMOTION, promotion.getId(), promotion.getTitle(), promotion.getRejectionReason());
    }

    /* ---------- Apartment listings ---------- */

    public void apartmentSubmitted(Apartment apartment, Long actorId, boolean resubmitted) {
        notifyStaff(Role.OPERATIONS_MANAGER, actorId,
                resubmitted ? "An apartment listing was resubmitted for your review." : "A new apartment listing was submitted for your review.",
                NotificationType.SUBMITTED, APARTMENT, apartment.getApartmentId(), apartment.getTitle(), null);
    }

    public void apartmentApproved(Apartment apartment, Long actorId) {
        notifyUser(apartment.getCreatedByStaffId(), actorId, "Your apartment listing was approved and is now publicly visible.",
                NotificationType.APPROVED, APARTMENT, apartment.getApartmentId(), apartment.getTitle(), null);
    }

    public void apartmentRejected(Apartment apartment, Long actorId) {
        notifyUser(apartment.getCreatedByStaffId(), actorId, "Your apartment listing was rejected and returned for changes.",
                NotificationType.REJECTED, APARTMENT, apartment.getApartmentId(), apartment.getTitle(), apartment.getRejectionReason());
    }

    /* ---------- Inquiries ---------- */

    public void inquirySubmitted(Inquiry inquiry) {
        notifyStaff(Role.CRO, inquiry.getCustomerId(), "A new customer inquiry needs a response.",
                NotificationType.SUBMITTED, INQUIRY, inquiry.getInquiryId(), titleOf(inquiry), null);
    }

    public void inquiryResponded(Inquiry inquiry) {
        notifyUser(inquiry.getCustomerId(), null, "Our team replied to your inquiry.",
                NotificationType.RESPONDED, INQUIRY, inquiry.getInquiryId(), titleOf(inquiry), null);
    }

    public void inquiryClosed(Inquiry inquiry) {
        notifyUser(inquiry.getCustomerId(), null, "Your inquiry was closed. Ask a new question any time.",
                NotificationType.COMPLETED, INQUIRY, inquiry.getInquiryId(), titleOf(inquiry), null);
    }

    /* ---------- Site visits ---------- */

    public void appointmentRequested(Appointment appointment) {
        notifyStaff(Role.CRO, customerIdOf(appointment), "A new site visit was requested.",
                NotificationType.REQUESTED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), null);
    }

    public void appointmentChanged(Appointment appointment) {
        notifyStaff(Role.CRO, customerIdOf(appointment), "A customer changed a pending site visit request.",
                NotificationType.REQUESTED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), null);
    }

    public void appointmentCancelled(Appointment appointment) {
        notifyStaff(Role.CRO, customerIdOf(appointment), "A customer cancelled a site visit.",
                NotificationType.CANCELLED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), null);
    }

    public void appointmentApproved(Appointment appointment) {
        notifyUser(customerIdOf(appointment), null, "Your site visit request was approved.",
                NotificationType.APPROVED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), null);
    }

    public void appointmentRescheduled(Appointment appointment) {
        notifyUser(customerIdOf(appointment), null, "Your site visit was rescheduled by our team.",
                NotificationType.RESCHEDULED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), null);
    }

    public void appointmentDeclined(Appointment appointment) {
        notifyUser(customerIdOf(appointment), null, "Your site visit request was declined.",
                NotificationType.REJECTED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), appointment.getDeclineReason());
    }

    public void appointmentCompleted(Appointment appointment) {
        notifyUser(customerIdOf(appointment), null, "Thanks for visiting — your site visit is marked as completed.",
                NotificationType.COMPLETED, APPOINTMENT, appointment.getAppointmentId(), titleOf(appointment), null);
    }

    /* ---------- Reservations ---------- */

    public void reservationSubmitted(Reservation reservation) {
        notifyStaff(Role.OPERATIONS_MANAGER, reservation.getCustomerId(), "A new reservation needs your approval.",
                NotificationType.SUBMITTED, RESERVATION, reservation.getReservationId(), titleOf(reservation), null);
    }

    public void reservationProofUploaded(Reservation reservation) {
        notifyStaff(Role.OPERATIONS_MANAGER, reservation.getCustomerId(), "Payment proof uploaded — the reservation is ready to review.",
                NotificationType.SUBMITTED, RESERVATION, reservation.getReservationId(), titleOf(reservation), null);
    }

    public void reservationChanged(Reservation reservation) {
        notifyStaff(Role.OPERATIONS_MANAGER, reservation.getCustomerId(), "A customer changed a pending reservation.",
                NotificationType.SUBMITTED, RESERVATION, reservation.getReservationId(), titleOf(reservation), null);
    }

    public void reservationCancelled(Reservation reservation) {
        notifyStaff(Role.OPERATIONS_MANAGER, reservation.getCustomerId(), "A customer cancelled a reservation.",
                NotificationType.CANCELLED, RESERVATION, reservation.getReservationId(), titleOf(reservation), null);
    }

    public void reservationApproved(Reservation reservation) {
        notifyUser(reservation.getCustomerId(), null, "Your reservation was approved — the apartment is now held for you.",
                NotificationType.APPROVED, RESERVATION, reservation.getReservationId(), titleOf(reservation), null);
    }

    public void reservationRejected(Reservation reservation) {
        notifyUser(reservation.getCustomerId(), null, "Your reservation was rejected.",
                NotificationType.REJECTED, RESERVATION, reservation.getReservationId(), titleOf(reservation), reservation.getRejectionReason());
    }

    /* ---------- Helpers ---------- */

    /** Tells every active user with the given role, plus every active Admin, except the person who acted. */
    private void notifyStaff(Role role, Long actorId, String message, NotificationType type,
                             String entityType, Long entityId, String entityTitle, String reason) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        for (User u : userRepository.findByRole(role)) recipients.put(u.getUserId(), u);
        for (User u : userRepository.findByRole(Role.ADMIN)) recipients.put(u.getUserId(), u);
        for (User u : recipients.values()) {
            if (u.isActiveOrDefault() && !Objects.equals(u.getUserId(), actorId)) {
                save(u.getUserId(), message, type, entityType, entityId, entityTitle, reason);
            }
        }
    }

    /** Tells one person, unless they are the one who acted. */
    private void notifyUser(Long userId, Long actorId, String message, NotificationType type,
                            String entityType, Long entityId, String entityTitle, String reason) {
        if (userId == null || Objects.equals(userId, actorId)) return;
        save(userId, message, type, entityType, entityId, entityTitle, reason);
    }

    private void save(Long userId, String message, NotificationType type,
                      String entityType, Long entityId, String entityTitle, String reason) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setMessage(message);
        n.setType(type);
        n.setRelatedEntityType(entityType);
        n.setRelatedEntityId(entityId);
        n.setEntityTitle(entityTitle);
        n.setReason(reason);
        n.setSentDate(LocalDateTime.now());
        notificationRepository.save(n);
    }

    private static Long customerIdOf(Appointment a) {
        return a.getCustomer() == null ? null : a.getCustomer().getUserId();
    }

    private static String titleOf(Inquiry i) {
        return i.getApartment() == null ? null : i.getApartment().getTitle();
    }

    private static String titleOf(Appointment a) {
        return a.getApartment() == null ? null : a.getApartment().getTitle();
    }

    private static String titleOf(Reservation r) {
        return r.getApartment() == null ? null : r.getApartment().getTitle();
    }
}
