package com.smartnest.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The user this notification belongs to
    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, length = 500)
    private String message;

    // e.g. "PROMOTION" — lets the frontend route a click to the right page as more modules are added
    @Column(nullable = false)
    private String relatedEntityType;

    private Long relatedEntityId;

    @Column(nullable = false)
    private LocalDateTime sentDate;

    // manual accessors + @JsonProperty so the JSON key stays "isRead" (Lombok's default would send "read")
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private boolean isRead = false;

    @JsonProperty("isRead")
    public boolean isRead() {
        return isRead;
    }

    @JsonProperty("isRead")
    public void setRead(boolean isRead) {
        this.isRead = isRead;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    // snapshot of the entity's title at send time, so the row still reads correctly if the entity is later edited or deleted
    private String entityTitle;

    // populated for rejections only
    @Column(length = 1000)
    private String reason;
}
