package com.smartnest.backend.controller;

import com.smartnest.backend.model.Notification;
import com.smartnest.backend.service.NotificationService;
import com.smartnest.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// every endpoint resolves the user from the JWT — there is no userId parameter to tamper with
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<Notification>> list(Authentication authentication) {
        return ResponseEntity.ok(notificationService.listFor(callerId(authentication)));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication authentication) {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(callerId(authentication))));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.markRead(id, callerId(authentication)));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(Authentication authentication) {
        return ResponseEntity.ok(Map.of("updated", notificationService.markAllRead(callerId(authentication))));
    }

    private Long callerId(Authentication authentication) {
        return userService.getByEmail(authentication.getName()).getUserId();
    }
}
