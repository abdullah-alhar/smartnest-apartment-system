package com.smartnest.backend.dto;

import com.smartnest.backend.model.Role;
import com.smartnest.backend.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSummaryResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private boolean isActive;

    public static UserSummaryResponse from(User user) {
        return new UserSummaryResponse(
                user.getUserId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.isActiveOrDefault()
        );
    }
}
