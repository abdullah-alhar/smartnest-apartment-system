package com.smartnest.backend.dto;

import com.smartnest.backend.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class UpdateReservationRequest {

    @NotNull
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;

    /** Optional: move the pending reservation to another apartment. */
    private Long apartmentId;
}
