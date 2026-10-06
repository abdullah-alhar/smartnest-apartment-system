package com.smartnest.backend.controller;

import com.smartnest.backend.dto.CreateStaffRequest;
import com.smartnest.backend.dto.UserSummaryResponse;
import com.smartnest.backend.model.*;
import com.smartnest.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @PostMapping("/create-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> createStaff(@Valid @RequestBody CreateStaffRequest request) {
        Staff staff = switch (request.getRole()) {
            case ADMIN -> new Admin();
            case CRO -> new CRO();
            case SALES_STAFF -> new SalesStaff();
            case OPERATIONS_MANAGER -> new OperationalManager();
            case MARKETING_EXECUTIVE -> new MarketingExecutive();
            default -> throw new IllegalArgumentException("Invalid staff role");
        };

        staff.setFirstName(request.getFirstName());
        staff.setLastName(request.getLastName());
        staff.setEmail(request.getEmail());
        staff.setPassword(request.getPassword());
        staff.setContactNumber(request.getContactNumber());
        staff.setRole(request.getRole());
        staff.setDepartment(request.getDepartment());

        userService.createStaffUser(staff);

        return ResponseEntity.ok("Staff account created successfully");
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserSummaryResponse>> listAllUsers() {
        return ResponseEntity.ok(userService.listAllUsers());
    }

    @PutMapping("/users/{userId}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deactivateUser(@PathVariable Long userId, Authentication authentication) {
        userService.setActive(userId, false, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Account deactivated"));
    }

    @PutMapping("/users/{userId}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> reactivateUser(@PathVariable Long userId, Authentication authentication) {
        userService.setActive(userId, true, authentication.getName());
        return ResponseEntity.ok(Map.of("message", "Account reactivated"));
    }
}
