
package com.homeserve.controller;

import com.homeserve.dto.ProfileUpdateRequest;
import com.homeserve.dto.UserResponse;
import com.homeserve.model.AppUser;
import com.homeserve.repository.UserRepository;
import com.homeserve.service.SessionTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository users;
    private final SessionTokenService tokens;

    public UserController(UserRepository users, SessionTokenService tokens) {
        this.users = users;
        this.tokens = tokens;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AppUser user = authenticatedUser(authorization);
        if (user == null) return unauthorized();
        return ResponseEntity.ok(UserResponse.from(user));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMyProfile(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody ProfileUpdateRequest request) {

        AppUser user = authenticatedUser(authorization);
        if (user == null) return unauthorized();

        String email = request.email().trim().toLowerCase();
        var existing = users.findByEmail(email).orElse(null);

        if (existing != null && !existing.getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "That email address is already in use"));
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(request.phone() == null || request.phone().isBlank()
                ? null : request.phone().trim());
        user.setAddress(request.address() == null || request.address().isBlank()
                ? null : request.address().trim());

        return ResponseEntity.ok(UserResponse.from(users.save(user)));
    }

    private AppUser authenticatedUser(String authorization) {
        Long id = tokens.userIdFromAuthorization(authorization);
        if (id == null) return null;

        // Permit customer and worker accounts to access their own profile.
        return users.findById(id)
                .filter(user ->
                        "CUSTOMER".equalsIgnoreCase(user.getRole())
                        || "USER".equalsIgnoreCase(user.getRole())
                        || "WORKER".equalsIgnoreCase(user.getRole()))
                .orElse(null);
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message",
                        "Session missing or expired. Please sign in again."));
    }
}
