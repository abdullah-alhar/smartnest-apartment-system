package com.smartnest.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeclineAppointmentRequest {

    @NotBlank
    @Size(max = 500)
    private String reason;
}
