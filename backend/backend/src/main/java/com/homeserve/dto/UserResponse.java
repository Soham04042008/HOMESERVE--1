
package com.homeserve.dto;

import com.homeserve.model.AppUser;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String address,
        String role
) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddress(),
                user.getRole()
        );
    }
}
