package com.smartnest.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RespondInquiryRequest {

    @NotBlank
    @Size(max = 2000)
    private String reply;
}
