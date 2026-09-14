package com.smartnest.backend.controller;

import com.smartnest.backend.dto.CreateStaffRequest;
import com.smartnest.backend.model.*;
import com.smartnest.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserService userService;

    @PostMapping("/create-staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> createStaff(@RequestBody CreateStaffRequest request) {
        Staff staff = switch (request.getRole()) {
            case ADMIN -> new Admin();
            case CRO -> new CRO();
            case SALES_STAFF -> new SalesStaff();
            case OPERATIONS_MANAGER -> new OperationalManager();
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
}
