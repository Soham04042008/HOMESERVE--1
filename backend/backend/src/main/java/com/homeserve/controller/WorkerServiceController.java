
package com.homeserve.controller;

import com.homeserve.dto.WorkerServiceRequest;
import com.homeserve.model.AppUser;
import com.homeserve.model.WorkerServiceEntity;
import com.homeserve.repository.UserRepository;
import com.homeserve.repository.WorkerServiceRepository;
import com.homeserve.service.SessionTokenService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/worker/services")
public class WorkerServiceController {

    private final WorkerServiceRepository services;
    private final UserRepository users;
    private final SessionTokenService tokens;

    public WorkerServiceController(
            WorkerServiceRepository services,
            UserRepository users,
            SessionTokenService tokens) {
        this.services = services;
        this.users = users;
        this.tokens = tokens;
    }

    // GET: List services belonging to the logged-in worker
    @GetMapping
    public ResponseEntity<?> list(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        AppUser user = currentWorker(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Worker login required."));
        }

        List<Map<String, Object>> result =
                services.findByWorkerIdOrderByIdDesc(user.getId())
                        .stream()
                        .map(this::toMap)
                        .toList();

        return ResponseEntity.ok(result);
    }

    // POST: Create a new service
    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @Valid @RequestBody WorkerServiceRequest request) {

        AppUser user = currentWorker(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Worker login required."));
        }

        ResponseEntity<?> priceError = validatePrices(request);
        if (priceError != null) {
            return priceError;
        }

        WorkerServiceEntity entity = new WorkerServiceEntity();
        entity.setWorkerId(user.getId());

        applyRequest(entity, request);

        WorkerServiceEntity saved = services.save(entity);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toMap(saved));
    }

    // PUT: Update an existing service
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long id,
            @Valid @RequestBody WorkerServiceRequest request) {

        AppUser user = currentWorker(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Worker login required."));
        }

        WorkerServiceEntity entity =
                services.findByIdAndWorkerId(id, user.getId())
                        .orElse(null);

        if (entity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Worker service not found."));
        }

        ResponseEntity<?> priceError = validatePrices(request);
        if (priceError != null) {
            return priceError;
        }

        // Update the existing record; do not create a new one.
        applyRequest(entity, request);

        WorkerServiceEntity saved = services.save(entity);

        return ResponseEntity.ok(toMap(saved));
    }

    // DELETE: Delete a service owned by the logged-in worker
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @PathVariable Long id) {

        AppUser user = currentWorker(authorization);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Worker login required."));
        }

        WorkerServiceEntity entity =
                services.findByIdAndWorkerId(id, user.getId())
                        .orElse(null);

        if (entity == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Worker service not found."));
        }

        services.delete(entity);

        return ResponseEntity.noContent().build();
    }

    // Apply request fields consistently during create and update
    private void applyRequest(
            WorkerServiceEntity entity,
            WorkerServiceRequest request) {

        entity.setName(request.name().trim());
        entity.setCategory(request.category().trim());
        entity.setSkills(join(request.skills()));
        entity.setDescription(request.description());
        entity.setExperienceYears(request.experienceYears());
        entity.setQualification(request.qualification());
        entity.setTools(request.tools());
        entity.setServiceAreas(join(request.serviceAreas()));
        entity.setEmergencyAvailable(request.emergencyAvailable());
        entity.setMinPrice(request.minPrice());
        entity.setMaxPrice(request.maxPrice());
        entity.setPricingType(request.pricingType());
    }

    // Validate minimum and maximum price
    private ResponseEntity<?> validatePrices(
            WorkerServiceRequest request) {

        if (request.minPrice() == null || request.maxPrice() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Both prices are required."));
        }

        if (request.maxPrice().compareTo(request.minPrice()) < 0) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "message",
                            "Maximum price must be greater than or equal to minimum price."
                    ));
        }

        return null;
    }

    // Find the authenticated worker
    private AppUser currentWorker(String authorization) {

        Long id = tokens.userIdFromAuthorization(authorization);

        if (id == null) {
            return null;
        }

        return users.findById(id)
                .filter(user ->
                        "WORKER".equalsIgnoreCase(user.getRole()))
                .orElse(null);
    }

    // Convert lists to comma-separated database values
    private String join(List<String> values) {

        if (values == null) {
            return "";
        }

        return values.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.joining(","));
    }

    // Convert database values back into lists
    private List<String> split(String value) {

        if (value == null || value.isBlank()) {
            return List.of();
        }

        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(valuePart -> !valuePart.isBlank())
                .toList();
    }

    // Convert entity to frontend response
    private Map<String, Object> toMap(WorkerServiceEntity service) {

        Map<String, Object> result = new LinkedHashMap<>();

        result.put("id", String.valueOf(service.getId()));
        result.put("worker_id", String.valueOf(service.getWorkerId()));
        result.put("name", service.getName());
        result.put("category", service.getCategory());
        result.put("skills", split(service.getSkills()));
        result.put("description", service.getDescription());
        result.put("experience_years", service.getExperienceYears());
        result.put("qualification", service.getQualification());
        result.put("tools", service.getTools());
        result.put("service_areas", split(service.getServiceAreas()));
        result.put("emergency_available", service.isEmergencyAvailable());
        result.put("min_price", service.getMinPrice());
        result.put("max_price", service.getMaxPrice());
        result.put("pricing_type", service.getPricingType());
        result.put("is_demo", false);

        return result;
    }
}
