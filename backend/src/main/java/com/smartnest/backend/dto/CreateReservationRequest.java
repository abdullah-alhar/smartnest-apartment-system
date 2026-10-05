package com.smartnest.backend.dto;

import com.smartnest.backend.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateReservationRequest {

    @NotNull
    private Long apartmentId;

    @NotNull
    private BigDecimal initialPaymentAmount;

    @NotNull
    private PaymentMethod paymentMethod;
}
