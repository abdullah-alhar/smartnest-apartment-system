package com.smartnest.backend.service;

import com.smartnest.backend.model.Notification;
import com.smartnest.backend.model.NotificationType;
import com.smartnest.backend.model.Promotion;
import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.User;
import com.smartnest.backend.repository.NotificationRepository;
import com.smartnest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final String PROMOTION = "PROMOTION";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<Notification> listFor(Long userId) {
        return notificationRepository.findByUserIdOrderBySentDateDesc(userId);
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    // scoped by owner too — someone else's notification id reads as "not found", never as a 403 that confirms it exists
    public Notification markRead(Long notificationId, Long userId) {
        Notification n = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        if (!n.isRead()) {
            n.setRead(true);
            n = notificationRepository.save(n);
        }
        return n;
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllReadForUser(userId);
    }

    // ---- promotion lifecycle triggers — callers pass the acting user so nobody is notified about their own action

    public void promotionSubmitted(Promotion promotion, Long actorId, boolean resubmitted) {
        String message = resubmitted
                ? "A promotion was resubmitted for your review."
                : "A new promotion was submitted for your review.";
        for (User manager : userRepository.findByRole(Role.OPERATIONS_MANAGER)) {
            if (manager.isActiveOrDefault() && !Objects.equals(manager.getUserId(), actorId)) {
                send(manager.getUserId(), message, NotificationType.SUBMITTED, promotion, null);
            }
        }
    }

    public void promotionApproved(Promotion promotion, Long actorId) {
        if (Objects.equals(promotion.getSalesStaffId(), actorId)) return;
        send(promotion.getSalesStaffId(), "Your promotion was approved and is now publicly visible.",
                NotificationType.APPROVED, promotion, null);
    }

    public void promotionRejected(Promotion promotion, Long actorId) {
        if (Objects.equals(promotion.getSalesStaffId(), actorId)) return;
        send(promotion.getSalesStaffId(), "Your promotion was rejected and returned for changes.",
                NotificationType.REJECTED, promotion, promotion.getRejectionReason());
    }

    private void send(Long userId, String message, NotificationType type, Promotion promotion, String reason) {
        if (userId == null) return;
        Notification n = new Notification();
        n.setUserId(userId);
        n.setMessage(message);
        n.setType(type);
        n.setRelatedEntityType(PROMOTION);
        n.setRelatedEntityId(promotion.getId());
        n.setEntityTitle(promotion.getTitle());
        n.setReason(reason);
        n.setSentDate(LocalDateTime.now());
        notificationRepository.save(n);
    }
}
