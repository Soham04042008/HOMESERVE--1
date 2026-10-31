package com.homeserve.controller;

import com.homeserve.dto.WorkerQualificationRequest;
import com.homeserve.dto.WorkerQualificationResponse;
import com.homeserve.model.AppUser;
import com.homeserve.model.WorkerProfile;
import com.homeserve.model.WorkerQualification;
import com.homeserve.repository.UserRepository;
import com.homeserve.repository.WorkerProfileRepository;
import com.homeserve.repository.WorkerQualificationRepository;
import com.homeserve.service.SessionTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workers/me/qualifications")
public class WorkerQualificationController {
    private final UserRepository users;
    private final WorkerProfileRepository profiles;
    private final WorkerQualificationRepository qualifications;
    private final SessionTokenService tokens;

    public WorkerQualificationController(UserRepository users,
            WorkerProfileRepository profiles,
            WorkerQualificationRepository qualifications,
            SessionTokenService tokens) {
        this.users = users;
        this.profiles = profiles;
        this.qualifications = qualifications;
        this.tokens = tokens;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String authorization) {
        WorkerProfile profile = currentProfile(authorization);
        if (profile == null) return unauthorized();
        List<WorkerQualificationResponse> result = qualifications
            .findByWorkerProfileIdOrderByIdAsc(profile.getId())
            .stream().map(WorkerQualificationResponse::from).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @Valid @RequestBody WorkerQualificationRequest request) {
        WorkerProfile profile = currentProfile(authorization);
        if (profile == null) return unauthorized();

        WorkerQualification q = new WorkerQualification();
        q.setWorkerProfile(profile);
        q.setType(request.type().trim());
        q.setTitle(request.title().trim());
        q.setInstitution(blankToNull(request.institution()));
        q.setYear(request.year());
        q.setDescription(blankToNull(request.description()));
        WorkerQualification saved = qualifications.save(q);
        return ResponseEntity.status(HttpStatus.CREATED).body(WorkerQualificationResponse.from(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        WorkerProfile profile = currentProfile(authorization);
        if (profile == null) return unauthorized();
        WorkerQualification q = qualifications.findByIdAndWorkerProfileId(id, profile.getId()).orElse(null);
        if (q == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("message", "Qualification not found for this worker."));
        qualifications.delete(q);
        return ResponseEntity.noContent().build();
    }

    private WorkerProfile currentProfile(String authorization) {
        Long userId = tokens.userIdFromAuthorization(authorization);
        if (userId == null) return null;
        AppUser user = users.findById(userId)
            .filter(u -> "WORKER".equalsIgnoreCase(u.getRole())).orElse(null);
        if (user == null) return null;
        return profiles.findByUserId(user.getId()).orElse(null);
    }

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("message", "Worker session missing or expired. Please sign in again."));
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
