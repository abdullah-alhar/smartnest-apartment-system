package com.smartnest.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateAppointmentRequest {

    @NotNull
    private Long apartmentId;

    @NotNull
    private LocalDateTime requestedDate;
}
