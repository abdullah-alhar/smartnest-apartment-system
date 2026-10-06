package com.smartnest.backend.controller;

import com.smartnest.backend.dto.AddPaymentRequest;
import com.smartnest.backend.dto.CreateReservationRequest;
import com.smartnest.backend.dto.UpdateReservationRequest;
import com.smartnest.backend.model.PaymentRecord;
import com.smartnest.backend.model.Reservation;
import com.smartnest.backend.model.User;
import com.smartnest.backend.service.ReservationService;
import com.smartnest.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Reservation> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(reservationService.createReservation(callerId(authentication), request));
    }

    @PostMapping("/{id}/payments")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Reservation> addPayment(
            @PathVariable Long id,
            @Valid @RequestBody AddPaymentRequest request,
            Authentication authentication) {
        boolean isAdmin = hasRole(authentication, "ADMIN");
        return ResponseEntity.ok(reservationService.addPayment(id, callerId(authentication), isAdmin, request));
    }

    @GetMapping("/{id}/payments")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<PaymentRecord>> getPayments(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = hasRole(authentication, "ADMIN") || hasRole(authentication, "OPERATIONS_MANAGER");
        return ResponseEntity.ok(reservationService.getPayments(id, callerId(authentication), isAdmin));
    }

    @PostMapping(value = "/{id}/proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Reservation> uploadPaymentProof(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        return ResponseEntity.ok(reservationService.attachPaymentProof(
                id, callerId(authentication), hasRole(authentication, "ADMIN"), file));
    }

    @GetMapping("/{id}/proof")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Resource> getPaymentProof(@PathVariable Long id, Authentication authentication) {
        boolean reviewer = hasRole(authentication, "ADMIN") || hasRole(authentication, "OPERATIONS_MANAGER");
        ReservationService.PaymentProof proof = reservationService.getPaymentProof(id, callerId(authentication), reviewer);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.inline().filename(proof.fileName()).build().toString())
                .body(proof.file());
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Reservation>> getCustomerReservations(
            @PathVariable Long customerId,
            Authentication authentication) {
        if (!hasRole(authentication, "ADMIN") && !hasRole(authentication, "OPERATIONS_MANAGER")) {
            Long id = callerId(authentication);
            if (!id.equals(customerId)) {
                throw new AccessDeniedException("You can only view your own reservations");
            }
        }
        return ResponseEntity.ok(reservationService.getCustomerReservations(customerId));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Reservation>> getPendingReservations() {
        return ResponseEntity.ok(reservationService.getPendingReservations());
    }

    @GetMapping
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Reservation>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Reservation> approveReservation(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId,
            Authentication authentication) {
        return ResponseEntity.ok(reservationService.approveReservation(id, operationsManagerId, hasRole(authentication, "ADMIN")));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Reservation> rejectReservation(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId,
            @RequestParam String reason,
            Authentication authentication) {
        return ResponseEntity.ok(reservationService.rejectReservation(id, operationsManagerId, reason, hasRole(authentication, "ADMIN")));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Reservation> cancelReservation(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(reservationService.cancelReservation(id, callerId(authentication)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Reservation> updateReservation(
            @PathVariable Long id,
            @Valid @RequestBody UpdateReservationRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(reservationService.updateReservation(
                id, callerId(authentication), hasRole(authentication, "ADMIN"), request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteReservation(@PathVariable Long id, Authentication authentication) {
        reservationService.deleteReservation(id, callerId(authentication), hasRole(authentication, "ADMIN"));
        return ResponseEntity.noContent().build();
    }

    private Long callerId(Authentication authentication) {
        User caller = userService.getByEmail(authentication.getName());
        return caller.getUserId();
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }
}
