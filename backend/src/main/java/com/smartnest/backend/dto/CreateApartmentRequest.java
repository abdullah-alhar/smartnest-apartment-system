package com.smartnest.backend.dto;

import com.smartnest.backend.model.Address;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateApartmentRequest {
    private String title;
    private String description;
    private BigDecimal price;
    private Integer roomCount;
    private Double size;
    private Address address;
}
