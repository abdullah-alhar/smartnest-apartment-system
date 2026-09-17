package com.smartnest.backend.dto;

import com.smartnest.backend.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private Long userId;
    private Role role;
    private String firstName;
    private String lastName;
}