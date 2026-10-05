package com.smartnest.backend.dto;

import com.smartnest.backend.model.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class AddPaymentRequest {

    @NotNull
    private BigDecimal amount;

    @NotNull
    private PaymentMethod paymentMethod;
}
