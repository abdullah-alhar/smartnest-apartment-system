package com.smartnest.backend.controller;

import com.smartnest.backend.dto.*;
import com.smartnest.backend.repository.UserRepository;
import com.smartnest.backend.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AppointmentResponse> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request,
            Authentication authentication) {
        Long customerId = resolveCallerId(authentication);
        return ResponseEntity.ok(appointmentService.createAppointment(customerId, request));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getCustomerAppointments(
            @PathVariable Long customerId,
            Authentication authentication) {
        if (!hasRole(authentication, "ADMIN") && !hasRole(authentication, "CRO")) {
            Long callerId = resolveCallerId(authentication);
            if (!callerId.equals(customerId)) {
                throw new AccessDeniedException("You can only view your own appointments");
            }
        }
        return ResponseEntity.ok(appointmentService.getCustomerAppointments(customerId));
    }

    @GetMapping("/available-slots/{apartmentId}")
    public ResponseEntity<List<AvailableSlotResponse>> getAvailableSlots(
            @PathVariable Long apartmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getAvailableSlots(apartmentId, date));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getPendingAppointments() {
        return ResponseEntity.ok(appointmentService.getPendingAppointments());
    }

    @GetMapping("/cro/{croId}")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getCROAppointments(
            @PathVariable Long croId,
            Authentication authentication) {
        if (!hasRole(authentication, "ADMIN")) {
            Long callerId = resolveCallerId(authentication);
            if (!callerId.equals(croId)) {
                throw new AccessDeniedException("You can only view your own assigned appointments");
            }
        }
        return ResponseEntity.ok(appointmentService.getCROAppointments(croId));
    }

    @GetMapping
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponse> approveAppointment(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(appointmentService.approveAppointment(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN")));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponse> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(appointmentService.rescheduleAppointment(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"), request));
    }

    @PutMapping("/{id}/decline")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponse> declineAppointment(
            @PathVariable Long id,
            @Valid @RequestBody DeclineAppointmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(appointmentService.declineAppointment(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"), request));
    }

    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponse> completeAppointment(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(appointmentService.completeAppointment(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN")));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<AppointmentResponse> cancelAppointment(
            @PathVariable Long id,
            Authentication authentication) {
        Long customerId = resolveCallerId(authentication);
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, customerId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<AppointmentResponse> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(appointmentService.updateAppointment(
                id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"), request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id, Authentication authentication) {
        appointmentService.deleteAppointment(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"));
        return ResponseEntity.noContent().build();
    }

    private Long resolveCallerId(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + authentication.getName()))
                .getUserId();
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
