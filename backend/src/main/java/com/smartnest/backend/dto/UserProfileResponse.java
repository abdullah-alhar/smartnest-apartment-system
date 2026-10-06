package com.smartnest.backend.dto;

import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String contactNumber;
    private Role role;

    public static UserProfileResponse from(User user) {
        return new UserProfileResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getContactNumber(),
                user.getRole()
        );
    }
}
