package com.smartnest.backend.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String contactNumber;
    private String city;
    private String postalCode;
    private String street;
    private String nic;
}