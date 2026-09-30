package com.smartnest.backend.service;

import com.smartnest.backend.dto.ChangePasswordRequest;
import com.smartnest.backend.dto.UpdateProfileRequest;
import com.smartnest.backend.dto.UserSummaryResponse;
import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.Staff;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // resolves the JWT identity (Authentication#getName() is the email) to the underlying User
    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

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

    public User updateProfile(String email, UpdateProfileRequest request) {
        User user = getByEmail(email);
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setContactNumber(request.getContactNumber());
        return userRepository.save(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {
        User user = getByEmail(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("New password must be at least 8 characters");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation do not match");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // base User table already carries role + isActive for every subtype, so one query covers staff and customers alike
    public List<UserSummaryResponse> listAllUsers() {
        return userRepository.findAll().stream().map(UserSummaryResponse::from).toList();
    }

    public void setActive(Long targetUserId, boolean active, String requestingAdminEmail) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + targetUserId));

        // an admin locking their own account out would need another admin to undo it — block it outright
        if (!active) {
            User requester = getByEmail(requestingAdminEmail);
            if (requester.getUserId().equals(targetUserId)) {
                throw new IllegalArgumentException("You cannot deactivate your own account");
            }
        }

        target.setIsActive(active);
        userRepository.save(target);
    }
}