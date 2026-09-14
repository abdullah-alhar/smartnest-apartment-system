package com.smartnest.backend.controller;

import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.service.PromotionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('ADMIN')")
    public ResponseEntity<Promotion> createPromotion(@RequestBody Promotion promotion) {
        Promotion saved = promotionService.createPromotion(promotion);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Promotion> approvePromotion(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId) {
        Promotion updated = promotionService.approvePromotion(id, operationsManagerId);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER')")
    public ResponseEntity<Promotion> rejectPromotion(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId,
            @RequestParam String reason) {
        Promotion updated = promotionService.rejectPromotion(id, operationsManagerId, reason);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<Promotion>> getActivePromotions() {
        return ResponseEntity.ok(promotionService.getActivePromotions());
    }

    @GetMapping("/my/{salesStaffId}")
    @PreAuthorize("hasRole('SALES_STAFF')")
    public ResponseEntity<List<Promotion>> getMyPromotions(@PathVariable Long salesStaffId) {
        return ResponseEntity.ok(promotionService.getMyPromotions(salesStaffId));
    }
}