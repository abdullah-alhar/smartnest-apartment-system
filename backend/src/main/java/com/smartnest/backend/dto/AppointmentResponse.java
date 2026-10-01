package com.smartnest.backend.dto;

import com.smartnest.backend.model.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {
    private Long appointmentId;

    private Long customerId;
    private String customerName;

    private Long apartmentId;
    private String apartmentTitle;

    private Long croId;
    private String croName;

    private LocalDateTime requestedDate;
    private LocalDateTime scheduledDate;
    private AppointmentStatus status;
    private String declineReason;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
