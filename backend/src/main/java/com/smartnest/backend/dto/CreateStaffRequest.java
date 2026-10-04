package com.smartnest.backend.dto;

import com.smartnest.backend.model.Role;
import lombok.Data;

@Data
public class CreateStaffRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String contactNumber;
    private Role role;
    private String department;
}
