package com.smartnest.backend.controller;

import com.smartnest.backend.dto.ApartmentCardResponse;
import com.smartnest.backend.dto.ApartmentDetailResponse;
import com.smartnest.backend.dto.ApartmentSearchCriteria;
import com.smartnest.backend.dto.CreateApartmentRequest;
import com.smartnest.backend.dto.PageResponse;
import com.smartnest.backend.dto.PriceRangeResponse;
import com.smartnest.backend.model.Apartment;
import com.smartnest.backend.model.User;
import com.smartnest.backend.service.ApartmentImageService;
import com.smartnest.backend.service.ApartmentQueryService;
import com.smartnest.backend.service.ApartmentService;
import com.smartnest.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/apartments")
@RequiredArgsConstructor
public class ApartmentController {

    private final ApartmentService apartmentService;
    private final ApartmentImageService apartmentImageService;
    private final ApartmentQueryService apartmentQueryService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApartmentDetailResponse> createApartment(
            @RequestBody CreateApartmentRequest request,
            Authentication authentication) {
        Long callerId = callerId(authentication);
        Apartment saved = apartmentService.createApartment(request, callerId);
        return ResponseEntity.ok(apartmentQueryService.getManageDetail(saved.getApartmentId(), callerId, true));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Apartment> approveApartment(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId,
            Authentication authentication) {
        return ResponseEntity.ok(apartmentService.approveApartment(id, operationsManagerId, callerId(authentication)));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Apartment> rejectApartment(
            @PathVariable Long id,
            @RequestParam Long operationsManagerId,
            @RequestParam String reason,
            Authentication authentication) {
        return ResponseEntity.ok(apartmentService.rejectApartment(id, operationsManagerId, reason, callerId(authentication)));
    }

    @PutMapping("/{id}/mark-sold")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Apartment> markSold(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentService.markSold(id));
    }

    private Long callerId(Authentication authentication) {
        return userService.getByEmail(authentication.getName()).getUserId();
    }

    @GetMapping
    public ResponseEntity<List<Apartment>> getApprovedApartments(
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer roomCount) {
        return ResponseEntity.ok(apartmentService.getApprovedApartments(minPrice, maxPrice, roomCount));
    }

    @GetMapping("/search")
    public ResponseEntity<PageResponse<ApartmentCardResponse>> searchApartments(ApartmentSearchCriteria criteria) {
        return ResponseEntity.ok(apartmentQueryService.search(criteria));
    }

    @GetMapping("/price-range")
    public ResponseEntity<PriceRangeResponse> getPriceRange() {
        return ResponseEntity.ok(apartmentQueryService.getPriceRange());
    }

    @GetMapping("/featured")
    public ResponseEntity<List<ApartmentCardResponse>> getFeatured() {
        return ResponseEntity.ok(apartmentQueryService.getFeatured());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApartmentDetailResponse> getApartmentById(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentQueryService.getPublicDetail(id));
    }

    @GetMapping("/{id}/similar")
    public ResponseEntity<List<ApartmentCardResponse>> getSimilar(@PathVariable Long id) {
        return ResponseEntity.ok(apartmentQueryService.getSimilar(id));
    }

    @GetMapping("/{id}/manage")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApartmentDetailResponse> getForEdit(@PathVariable Long id, Authentication authentication) {
        boolean canSeeAll = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_OPERATIONS_MANAGER"));
        return ResponseEntity.ok(apartmentQueryService.getManageDetail(id, callerId(authentication), canSeeAll));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Apartment>> getPendingApartments() {
        return ResponseEntity.ok(apartmentService.getPendingApartments());
    }

    @GetMapping("/mine/{staffId}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Apartment>> getMyApartments(@PathVariable Long staffId, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            User caller = userService.getByEmail(authentication.getName());
            if (!caller.getUserId().equals(staffId)) {
                throw new AccessDeniedException("You can only view your own apartment listings");
            }
        }
        return ResponseEntity.ok(apartmentService.getMyApartments(staffId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApartmentDetailResponse> updateApartment(
            @PathVariable Long id,
            @RequestBody CreateApartmentRequest request,
            Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        User caller = userService.getByEmail(authentication.getName());
        apartmentService.updateApartment(id, request, caller.getUserId(), isAdmin);
        return ResponseEntity.ok(apartmentQueryService.getManageDetail(id, caller.getUserId(), true));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApartmentDetailResponse> uploadImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        User caller = userService.getByEmail(authentication.getName());
        apartmentImageService.setImage(id, file, caller.getUserId(), isAdmin(authentication));
        return ResponseEntity.ok(apartmentQueryService.getManageDetail(id, caller.getUserId(), true));
    }

    @DeleteMapping("/{id}/image")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApartmentDetailResponse> removeImage(@PathVariable Long id, Authentication authentication) {
        User caller = userService.getByEmail(authentication.getName());
        apartmentImageService.removeImage(id, caller.getUserId(), isAdmin(authentication));
        return ResponseEntity.ok(apartmentQueryService.getManageDetail(id, caller.getUserId(), true));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SALES_STAFF') or hasRole('OPERATIONS_MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteApartment(@PathVariable Long id, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        User caller = userService.getByEmail(authentication.getName());
        apartmentService.deleteApartment(id, caller.getUserId(), isAdmin);
        return ResponseEntity.noContent().build();
    }
}
