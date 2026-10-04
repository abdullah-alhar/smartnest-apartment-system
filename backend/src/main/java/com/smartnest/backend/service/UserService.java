package com.smartnest.backend.service;

import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.Staff;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User createStaffUser(Staff staff) {
        if (userRepository.existsByEmail(staff.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (staff.getRole() == Role.CUSTOMER) {
            throw new IllegalArgumentException("Use /register for customer accounts");
        }
        staff.setPassword(passwordEncoder.encode(staff.getPassword()));
        return userRepository.save(staff);
    }
}