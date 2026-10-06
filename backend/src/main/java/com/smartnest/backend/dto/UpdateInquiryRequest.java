package com.smartnest.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateInquiryRequest {

    @NotBlank
    @Size(max = 2000)
    private String question;
}
