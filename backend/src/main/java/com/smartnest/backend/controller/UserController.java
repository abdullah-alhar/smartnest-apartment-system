package com.smartnest.backend.controller;

import com.smartnest.backend.dto.ChangePasswordRequest;
import com.smartnest.backend.dto.UpdateProfileRequest;
import com.smartnest.backend.dto.UserProfileResponse;
import com.smartnest.backend.model.User;
import com.smartnest.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// always resolve the target user from the JWT, never a client-supplied id — can't touch someone else's account
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        return ResponseEntity.ok(UserProfileResponse.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        User updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(UserProfileResponse.from(updated));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changeMyPassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
