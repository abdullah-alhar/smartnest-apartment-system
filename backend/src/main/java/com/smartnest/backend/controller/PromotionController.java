package com.smartnest.backend.controller;

import com.smartnest.backend.dto.CreatePromotionRequest;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.User;
import com.smartnest.backend.service.PromotionService;
import com.smartnest.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ADMIN is layered onto every rule below as a super-role — hasRole() auto-prefixes "ROLE_", don't pass "ROLE_ADMIN" or it doubles up
@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Promotion> createPromotion(@RequestBody CreatePromotionRequest request) {
        return ResponseEntity.ok(promotionService.createPromotion(request));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Promotion> approvePromotion(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId) {
        return ResponseEntity.ok(promotionService.approvePromotion(id, operationsManagerId));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Promotion> rejectPromotion(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId,
            @RequestParam String reason) {
        return ResponseEntity.ok(promotionService.rejectPromotion(id, operationsManagerId, reason));
    }

    // public, no auth needed — returns only APPROVED promotions
    @GetMapping
    public ResponseEntity<List<Promotion>> getActivePromotions() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Promotion>> getPendingPromotions() {
        return ResponseEntity.ok(promotionService.getPendingPromotions());
    }

    @GetMapping("/my/{salesStaffId}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<List<Promotion>> getMyPromotions(@PathVariable Long salesStaffId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        // SalesStaff can only ever see their own — id in the URL must match their own JWT identity
        if (!isAdmin) {
            User caller = userService.getByEmail(authentication.getName());
            if (!caller.getUserId().equals(salesStaffId)) {
                throw new AccessDeniedException("You can only view your own promotions");
            }
        }
        return ResponseEntity.ok(promotionService.getMyPromotions(salesStaffId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Promotion> updatePromotion(
            @PathVariable Long id,
            @RequestBody CreatePromotionRequest request,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        User caller = userService.getByEmail(authentication.getName());
        return ResponseEntity.ok(promotionService.updatePromotion(id, request, caller.getUserId(), isAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Void> deletePromotion(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        User caller = userService.getByEmail(authentication.getName());
        promotionService.deletePromotion(id, caller.getUserId(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
