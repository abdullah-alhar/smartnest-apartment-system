package com.smartnest.backend.controller;

import com.smartnest.backend.dto.CreateInquiryRequest;
import com.smartnest.backend.dto.RespondInquiryRequest;
import com.smartnest.backend.dto.UpdateInquiryRequest;
import com.smartnest.backend.model.Inquiry;
import com.smartnest.backend.repository.UserRepository;
import com.smartnest.backend.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Inquiry> createInquiry(
            @Valid @RequestBody CreateInquiryRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(inquiryService.createInquiry(resolveCallerId(authentication), request));
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<Inquiry>> getCustomerInquiries(
            @PathVariable Long customerId,
            Authentication authentication) {
        if (!hasRole(authentication, "ADMIN") && !hasRole(authentication, "CRO")) {
            Long callerId = resolveCallerId(authentication);
            if (!callerId.equals(customerId)) {
                throw new AccessDeniedException("You can only view your own inquiries");
            }
        }
        return ResponseEntity.ok(inquiryService.getCustomerInquiries(customerId));
    }

    @GetMapping("/new")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<Inquiry>> getNewInquiries() {
        return ResponseEntity.ok(inquiryService.getNewInquiries());
    }

    @GetMapping("/cro/{croId}")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<Inquiry>> getCROInquiries(
            @PathVariable Long croId,
            Authentication authentication) {
        if (!hasRole(authentication, "ADMIN")) {
            Long callerId = resolveCallerId(authentication);
            if (!callerId.equals(croId)) {
                throw new AccessDeniedException("You can only view your own assigned inquiries");
            }
        }
        return ResponseEntity.ok(inquiryService.getCROInquiries(croId));
    }

    @GetMapping
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<List<Inquiry>> getAllInquiries() {
        return ResponseEntity.ok(inquiryService.getAllInquiries());
    }

    @PutMapping("/{id}/claim")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<Inquiry> claimInquiry(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(inquiryService.claimInquiry(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN")));
    }

    @PutMapping("/{id}/respond")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<Inquiry> respondToInquiry(
            @PathVariable Long id,
            @Valid @RequestBody RespondInquiryRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(inquiryService.respondToInquiry(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"), request));
    }

    @PutMapping("/{id}/close")
    @PreAuthorize("hasRole('CRO') or hasRole('ADMIN')")
    public ResponseEntity<Inquiry> closeInquiry(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(inquiryService.closeInquiry(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN")));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Inquiry> updateInquiry(
            @PathVariable Long id,
            @Valid @RequestBody UpdateInquiryRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(inquiryService.updateInquiry(
                id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"), request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteInquiry(@PathVariable Long id, Authentication authentication) {
        inquiryService.deleteInquiry(id, resolveCallerId(authentication), hasRole(authentication, "ADMIN"));
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
