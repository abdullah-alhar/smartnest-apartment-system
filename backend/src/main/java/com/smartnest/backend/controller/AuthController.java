package com.smartnest.backend.controller;

import com.smartnest.backend.dto.AuthResponse;
import com.smartnest.backend.dto.LoginRequest;
import com.smartnest.backend.dto.RegisterRequest;
import com.smartnest.backend.model.Address;
import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.Customer;
import com.smartnest.backend.model.User;
import com.smartnest.backend.security.JwtUtil;
import com.smartnest.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        Customer customer = new Customer();
        customer.setFirstName(request.getFirstName());
        customer.setLastName(request.getLastName());
        customer.setEmail(request.getEmail());
        customer.setPassword(request.getPassword());
        customer.setContactNumber(request.getContactNumber());
        // uppercase so the trailing V/X letter is stored consistently either way it was typed
        customer.setNic(request.getNic().toUpperCase());
        customer.setRole(Role.CUSTOMER);

        Address address = new Address();
        address.setCity(request.getCity());
        address.setStreet(request.getStreet());
        address.setPostalCode(request.getPostalCode());
        customer.setAddress(address);

        User saved = userService.registerUser(customer);

        String token = jwtUtil.generateToken(saved.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, saved.getUserId(), saved.getRole(), saved.getFirstName(), saved.getLastName()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userService.getByEmail(request.getEmail());
        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getUserId(), user.getRole(), user.getFirstName(), user.getLastName()));
    }
}
