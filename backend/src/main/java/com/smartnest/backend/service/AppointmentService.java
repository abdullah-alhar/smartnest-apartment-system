package com.smartnest.backend.service;

import com.smartnest.backend.dto.AppointmentResponse;
import com.smartnest.backend.dto.AvailableSlotResponse;
import com.smartnest.backend.dto.CreateAppointmentRequest;
import com.smartnest.backend.dto.DeclineAppointmentRequest;
import com.smartnest.backend.dto.RescheduleAppointmentRequest;
import com.smartnest.backend.dto.UpdateAppointmentRequest;
import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.Appointment;
import com.smartnest.backend.model.AppointmentStatus;
import com.smartnest.backend.model.CRO;
import com.smartnest.backend.model.Customer;
import com.smartnest.backend.repository.ApartmentRepository;
import com.smartnest.backend.repository.AppointmentRepository;
import com.smartnest.backend.repository.CRORepository;
import com.smartnest.backend.repository.CustomerRepository;
import com.smartnest.backend.event.AppointmentEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final CustomerRepository customerRepository;
    private final ApartmentRepository apartmentRepository;
    private final CRORepository croRepository;
    private final ApplicationEventPublisher events; // Observer pattern: we only publish events

    private static final LocalTime WORK_START = LocalTime.of(9, 0);
    private static final LocalTime WORK_END = LocalTime.of(17, 0);
    private static final int SLOT_DURATION_MINUTES = 30;
    private static final int MAX_VISITS_PER_SLOT = 1;

    @Transactional
    public AppointmentResponse createAppointment(Long customerId, CreateAppointmentRequest req) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Customer not found: " + customerId));

        Apartment apartment = apartmentRepository.findById(req.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + req.getApartmentId()));

        LocalDateTime requested = req.getRequestedDate();

        if (requested.toLocalTime().isBefore(WORK_START) ||
                requested.toLocalTime().isAfter(WORK_END.minusMinutes(SLOT_DURATION_MINUTES))) {
            throw new IllegalArgumentException("Requested time is outside working hours (09:00–17:00)");
        }

        if (appointmentRepository.isSlotTaken(apartment.getApartmentId(), requested)) {
            throw new IllegalArgumentException("Selected time slot is no longer available");
        }

        Appointment appointment = new Appointment();
        appointment.setCustomer(customer);
        appointment.setApartment(apartment);
        appointment.setRequestedDate(requested);
        appointment.setScheduledDate(requested);
        appointment.setStatus(AppointmentStatus.PENDING);

        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.REQUESTED, saved));

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getCustomerAppointments(Long customerId) {
        return appointmentRepository.findByCustomerUserIdOrderByRequestedDateDesc(customerId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getPendingAppointments() {
        return appointmentRepository.findByStatusOrderByRequestedDateAsc(AppointmentStatus.PENDING)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getCROAppointments(Long croId) {
        return appointmentRepository.findByCroUserIdOrderByRequestedDateAsc(croId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAllByOrderByRequestedDateDesc()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public AppointmentResponse approveAppointment(Long appointmentId, Long callerId, boolean isAdmin) {
        Appointment appointment = getAppointment(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new IllegalArgumentException("Only pending appointments can be approved");
        }

        if (!isAdmin) appointment.setCro(getCro(callerId));
        appointment.setScheduledDate(appointment.getRequestedDate());
        appointment.setStatus(AppointmentStatus.APPROVED);

        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.APPROVED, saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long appointmentId, Long callerId, boolean isAdmin, RescheduleAppointmentRequest req) {
        Appointment appointment = getAppointment(appointmentId);

        if (appointment.getStatus() == AppointmentStatus.DECLINED ||
                appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot reschedule a declined or cancelled appointment");
        }

        LocalDateTime newSlot = req.getNewScheduledDate();

        if (newSlot.toLocalTime().isBefore(WORK_START) ||
                newSlot.toLocalTime().isAfter(WORK_END.minusMinutes(SLOT_DURATION_MINUTES))) {
            throw new IllegalArgumentException("New time is outside working hours");
        }

        if (appointmentRepository.isSlotTaken(appointment.getApartment().getApartmentId(), newSlot)) {
            throw new IllegalArgumentException("Selected time slot is not available");
        }

        if (!isAdmin) appointment.setCro(getCro(callerId));
        appointment.setScheduledDate(newSlot);
        appointment.setStatus(AppointmentStatus.RESCHEDULED);

        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.RESCHEDULED, saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse declineAppointment(Long appointmentId, Long callerId, boolean isAdmin, DeclineAppointmentRequest req) {
        Appointment appointment = getAppointment(appointmentId);

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Completed appointments cannot be declined");
        }

        if (!isAdmin) appointment.setCro(getCro(callerId));
        appointment.setStatus(AppointmentStatus.DECLINED);
        appointment.setDeclineReason(req.getReason());

        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.DECLINED, saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse completeAppointment(Long appointmentId, Long callerId, boolean isAdmin) {
        Appointment appointment = getAppointment(appointmentId);

        if (appointment.getStatus() != AppointmentStatus.APPROVED && appointment.getStatus() != AppointmentStatus.RESCHEDULED) {
            throw new IllegalArgumentException("Only an approved or rescheduled appointment can be marked completed");
        }

        if (!isAdmin) appointment.setCro(getCro(callerId));
        appointment.setStatus(AppointmentStatus.COMPLETED);

        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.COMPLETED, saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long customerId) {
        Appointment appointment = getAppointment(appointmentId);

        if (!appointment.getCustomer().getUserId().equals(customerId)) {
            throw new AccessDeniedException("You can only cancel your own appointments");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED
                || appointment.getStatus() == AppointmentStatus.DECLINED
                || appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalArgumentException("This appointment can no longer be cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.CANCELLED, saved));
        return toResponse(saved);
    }

    @Transactional
    public AppointmentResponse updateAppointment(Long appointmentId, Long callerId, boolean isAdmin, UpdateAppointmentRequest req) {
        Appointment appointment = getAppointment(appointmentId);
        if (!isAdmin && !appointment.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only edit your own appointments");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new IllegalArgumentException("Only a pending appointment can be edited");
        }

        Apartment apartment = apartmentRepository.findById(req.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found: " + req.getApartmentId()));
        LocalDateTime requested = req.getRequestedDate();

        if (requested.toLocalTime().isBefore(WORK_START) ||
                requested.toLocalTime().isAfter(WORK_END.minusMinutes(SLOT_DURATION_MINUTES))) {
            throw new IllegalArgumentException("Requested time is outside working hours (09:00–17:00)");
        }

        if (appointmentRepository.isSlotTakenExcluding(apartment.getApartmentId(), requested, appointmentId)) {
            throw new IllegalArgumentException("Selected time slot is no longer available");
        }

        appointment.setApartment(apartment);
        appointment.setRequestedDate(requested);
        appointment.setScheduledDate(requested);
        Appointment saved = appointmentRepository.save(appointment);
        events.publishEvent(new AppointmentEvent(AppointmentEvent.Action.CHANGED, saved));
        return toResponse(saved);
    }

    @Transactional
    public void deleteAppointment(Long appointmentId, Long callerId, boolean isAdmin) {
        Appointment appointment = getAppointment(appointmentId);
        if (!isAdmin && !appointment.getCustomer().getUserId().equals(callerId)) {
            throw new AccessDeniedException("You can only delete your own appointments");
        }
        if (appointment.getStatus() != AppointmentStatus.PENDING) {
            throw new IllegalArgumentException("Only a pending appointment can be deleted");
        }
        appointmentRepository.delete(appointment);
    }

    @Transactional(readOnly = true)
    public List<AvailableSlotResponse> getAvailableSlots(Long apartmentId, LocalDate date) {
        LocalDateTime start = date.atTime(WORK_START);
        LocalDateTime end = date.atTime(WORK_END);

        List<Appointment> existing =
                appointmentRepository.findActiveAppointmentsForDay(apartmentId, start, end);

        List<AvailableSlotResponse> slots = new ArrayList<>();
        LocalDateTime cursor = start;
        while (cursor.isBefore(end)) {
            final LocalDateTime slot = cursor;
            long bookedCount = existing.stream()
                    .filter(a -> a.getScheduledDate() != null &&
                            a.getScheduledDate().equals(slot))
                    .count();

            slots.add(new AvailableSlotResponse(slot, bookedCount < MAX_VISITS_PER_SLOT));
            cursor = cursor.plusMinutes(SLOT_DURATION_MINUTES);
        }
        return slots;
    }

    private Appointment getAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found: " + id));
    }

    private CRO getCro(Long id) {
        return croRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CRO not found: " + id));
    }

    private AppointmentResponse toResponse(Appointment a) {
        Customer c = a.getCustomer();
        CRO cro = a.getCro();

        return AppointmentResponse.builder()
                .appointmentId(a.getAppointmentId())

                .customerId(c.getUserId())
                .customerName(c.getFirstName() + " " + c.getLastName())

                .apartmentId(a.getApartment().getApartmentId())
                .apartmentTitle(a.getApartment().getTitle())

                .croId(cro != null ? cro.getUserId() : null)
                .croName(cro != null
                        ? cro.getFirstName() + " " + cro.getLastName()
                        : null)

                .requestedDate(a.getRequestedDate())
                .scheduledDate(a.getScheduledDate())
                .status(a.getStatus())
                .declineReason(a.getDeclineReason())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
