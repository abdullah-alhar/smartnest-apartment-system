package com.smartnest.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "Contact number is required")
    private String contactNumber;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Postal code is required")
    private String postalCode;

    @NotBlank(message = "Street address is required")
    private String street;

    // old format: 9 digits + V/X (e.g. 851234567V), new format: 12 digits, no letter
    @NotBlank(message = "NIC is required")
    @Pattern(
            regexp = "^([0-9]{9}[vVxX]|[0-9]{12})$",
            message = "Please enter a valid Sri Lankan NIC number (old format: 9 digits + V/X, or new format: 12 digits)"
    )
    private String nic;
}
