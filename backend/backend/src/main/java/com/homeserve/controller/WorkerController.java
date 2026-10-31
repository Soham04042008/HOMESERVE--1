
package com.homeserve.controller;

import com.homeserve.dto.*;
import com.homeserve.model.*;
import com.homeserve.repository.*;
import java.util.List;
import java.util.ArrayList;
import com.homeserve.service.SessionTokenService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/workers")
public class WorkerController {

    private final UserRepository users;
    private final WorkerProfileRepository workers;
    private final WorkerServiceRepository workerServices;
    private final WorkerPortfolioRepository portfolios;
    private final BookingRepository bookings;
    private final PasswordEncoder encoder;
    private final SessionTokenService tokens;
    private final SecureRandom random = new SecureRandom();

    public WorkerController(
            UserRepository users,
            WorkerProfileRepository workers,
            WorkerServiceRepository workerServices,
            WorkerPortfolioRepository portfolios,
            BookingRepository bookings,
            PasswordEncoder encoder,
            SessionTokenService tokens) {
        this.users = users;
        this.workers = workers;
        this.workerServices = workerServices;
        this.portfolios = portfolios;
        this.bookings = bookings;
        this.encoder = encoder;
        this.tokens = tokens;
    }

    /** Public marketplace directory used by the customer Find Pros page. */
    @GetMapping("/directory")
    public ResponseEntity<?> directory() {
        List<Map<String, Object>> result = new ArrayList<>();
        List<WorkerProfile> profiles = workers.findAll();
        // Fetch all worker services in one query instead of issuing one query per worker.
        // The old loop caused N+1 database round trips on every Find Pros page load.
        List<Long> workerIds = profiles.stream().map(p -> p.getUser().getId()).distinct().toList();
        Map<Long, List<WorkerServiceEntity>> servicesByWorker = new java.util.HashMap<>();
        java.util.Set<Long> busyWorkerIds = new java.util.HashSet<>();
        if (!workerIds.isEmpty()) {
            for (Booking booking : bookings.findByWorkerIdInAndStatusIn(workerIds, List.of("IN_PROGRESS"))) {
                if (booking.getWorkerId() != null) busyWorkerIds.add(booking.getWorkerId());
            }
            for (WorkerServiceEntity service : workerServices.findByWorkerIdInOrderByIdDesc(workerIds)) {
                servicesByWorker.computeIfAbsent(service.getWorkerId(), ignored -> new ArrayList<>()).add(service);
            }
        }
        for (WorkerProfile profile : profiles) {
            AppUser user = profile.getUser();
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", "worker-" + user.getId());
            item.put("user_id", user.getId());
            item.put("name", user.getFullName());
            item.put("category", marketplaceCategory(profile.getServiceCategory()));
            item.put("specialization", profile.getHeadline() == null || profile.getHeadline().isBlank()
                    ? (profile.getServiceCategory() == null ? "Home services" : profile.getServiceCategory())
                    : profile.getHeadline());
            item.put("bio", profile.getBio() == null ? "Home service professional." : profile.getBio());
            item.put("avatar", profile.getAvatarUrl());
            // Ratings are not stored in the current MySQL worker profile schema.
            item.put("rating", 0);
            item.put("reviews", 0);
            int price = profile.getStartingPrice() == null ? 0 : profile.getStartingPrice();
            item.put("starting_price", price);
            item.put("area", profile.getCity() == null || profile.getCity().isBlank() ? "Location not specified" : profile.getCity().replaceFirst(",\\s*(Mumbai|Navi Mumbai)$", ""));
            item.put("experience_years", profile.getExperienceYears() == null ? 0 : profile.getExperienceYears());
            String availability = profile.getAvailabilityStatus() == null ? "UNAVAILABLE" : profile.getAvailabilityStatus().toUpperCase(Locale.ROOT);
            // Keep unavailable workers visible in the directory, but clearly mark them.
            // The frontend disables booking for this status.
            if ("UNAVAILABLE".equals(availability)) {
                item.put("availability", "Unavailable");
            } else {
                boolean hasActiveJob = busyWorkerIds.contains(user.getId());
                if (hasActiveJob || "BUSY".equals(availability)) {
                    item.put("availability", "Busy");
                } else {
                String schedule = profile.getWorkingDaysJson();
                String today = java.time.LocalDate.now().getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH);
                boolean todayEnabled = scheduleHasEnabledDay(schedule, today);
                boolean anyEnabled = scheduleHasAnyEnabledDay(schedule);
                if (schedule == null || schedule.isBlank() || "{}".equals(schedule)) item.put("availability", "Available Today");
                else if (todayEnabled) item.put("availability", "Available Today");
                else if (anyEnabled) item.put("availability", "Available This Week");
                else item.put("availability", "Busy");
                }
            }
            item.put("verified", "VERIFIED".equalsIgnoreCase(profile.getVerificationStatus()));
            item.put("phone", user.getPhone());
            item.put("is_demo", false);
            List<Map<String, Object>> serviceList = new ArrayList<>(servicesByWorker.getOrDefault(user.getId(), List.of())
                    .stream().map(service -> {
                        Map<String, Object> serviceItem = new java.util.LinkedHashMap<>();
                        serviceItem.put("id", service.getId());
                        serviceItem.put("worker_service_id", service.getId());
                        serviceItem.put("name", service.getName());
                        serviceItem.put("price", service.getMinPrice() == null ? price : service.getMinPrice().intValue());
                        return serviceItem;
                    }).toList());
            if (serviceList.isEmpty()) {
                serviceList.add(Map.of("name", profile.getServiceCategory() == null ? "Home service" : profile.getServiceCategory(), "price", price));
            }
            item.put("services", serviceList);
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    private String marketplaceCategory(String value) {
        if (value == null || value.isBlank()) return "Handyman";
        String normalized = value.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "electrical", "electrician" -> "Electrician";
            case "plumbing", "plumber" -> "Plumbing";
            case "cleaning", "cleaner" -> "Cleaning";
            case "carpentry", "carpenter" -> "Carpentry";
            case "painting", "painter" -> "Painting";
            case "ac repair", "air conditioning" -> "AC Repair";
            default -> "Handyman";
        };
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody WorkerRegisterRequest req) {

        String email = req.email().trim().toLowerCase(Locale.ROOT);

        if (users.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email is already registered"));
        }

        AppUser user = new AppUser();
        user.setFullName(req.fullName().trim());
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(req.password()));
        user.setPhone(
                req.phone() == null || req.phone().isBlank()
                        ? null : req.phone().trim());
        user.setRole("WORKER");

        user = users.save(user);

        WorkerProfile profile = new WorkerProfile();
        profile.setUser(user);
        profile.setWorkerCode(generateWorkerCode());
        profile.setServiceCategory(req.serviceCategory().trim());
        profile.setExperienceYears(
                req.experienceYears() == null ? 0 : req.experienceYears());
        profile.setCity(blankToNull(req.city()));
        profile.setState(blankToNull(req.state()));
        profile.setPincode(blankToNull(req.pincode()));

        profile = workers.save(profile);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "token", tokens.createToken(user.getId()),
                        "user", UserResponse.from(user),
                        "worker", WorkerProfileResponse.from(profile)
                ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest req) {

        String email = req.email().trim().toLowerCase(Locale.ROOT);
        AppUser user = users.findByEmail(email).orElse(null);

        // Temporary diagnostic logs. Never log passwords or password hashes.
        System.out.println("[Worker Login] Email lookup completed.");
        System.out.println("[Worker Login] Account found: " + (user != null));

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        boolean passwordMatches =
                encoder.matches(req.password(), user.getPasswordHash());

        System.out.println(
                "[Worker Login] Password matches: " + passwordMatches);

        if (!passwordMatches) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password"));
        }

        if (!"WORKER".equalsIgnoreCase(user.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "message",
                            "This login is for worker accounts only"));
        }

        WorkerProfile profile =
                workers.findByUserId(user.getId()).orElse(null);

        if (profile == null) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "message",
                            "Worker profile is missing. Contact support."));
        }

        return ResponseEntity.ok(
                Map.of(
                        "token", tokens.createToken(user.getId()),
                        "user", UserResponse.from(user),
                        "worker", WorkerProfileResponse.from(profile)
                ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(
            @RequestHeader(value = "Authorization", required = false)
            String authorization) {

        AppUser user = workerFromToken(authorization);

        if (user == null) {
            return unauthorized();
        }

        return workers.findByUserId(user.getId())
                .<ResponseEntity<?>>map(
                        profile -> ResponseEntity.ok(
                                WorkerProfileResponse.from(profile)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Worker profile not found")));
    }

    @PutMapping("/me")
    public ResponseEntity<?> update(
            @RequestHeader(value = "Authorization", required = false)
            String authorization,
            @Valid @RequestBody WorkerProfileUpdateRequest req) {

        AppUser user = workerFromToken(authorization);

        if (user == null) {
            return unauthorized();
        }

        WorkerProfile profile =
                workers.findByUserId(user.getId()).orElse(null);

        if (profile == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Worker profile not found"));
        }

        if (req.fullName() != null && !req.fullName().isBlank()) {
            user.setFullName(req.fullName().trim());
        }
        if (req.email() != null && !req.email().isBlank()) {
            String normalizedEmail = req.email().trim().toLowerCase(Locale.ROOT);
            AppUser existing = users.findByEmail(normalizedEmail).orElse(null);
            if (existing != null && !existing.getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("message", "That email is already used by another account."));
            }
            user.setEmail(normalizedEmail);
        }
        if (req.phone() != null) user.setPhone(blankToNull(req.phone()));
        if (req.address() != null) {
            user.setAddress(blankToNull(req.address()));
            profile.setAddress(blankToNull(req.address()));
        }
        if (req.avatarUrl() != null) profile.setAvatarUrl(blankToNull(req.avatarUrl()));
        if (req.dateOfBirth() != null) {
            try {
                profile.setDateOfBirth(req.dateOfBirth().isBlank() ? null : LocalDate.parse(req.dateOfBirth()));
            } catch (java.time.format.DateTimeParseException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Date of birth must use YYYY-MM-DD format."));
            }
        }
        if (req.gender() != null) profile.setGender(blankToNull(req.gender()));
        if (req.preferredAreasJson() != null) profile.setPreferredAreasJson(validJsonArray(req.preferredAreasJson()));
        if (req.languagesJson() != null) profile.setLanguagesJson(validJsonArray(req.languagesJson()));
        if (req.additionalChargesJson() != null) profile.setAdditionalChargesJson(validJsonArray(req.additionalChargesJson()));
        if (req.minPrice() != null) profile.setMinPrice(req.minPrice());
        if (req.maxPrice() != null) profile.setMaxPrice(req.maxPrice());
        if (req.pricingType() != null && !req.pricingType().isBlank()) profile.setPricingType(req.pricingType().trim());
        if (req.visitCharge() != null) profile.setVisitCharge(req.visitCharge());
        if (req.negotiable() != null) profile.setNegotiable(req.negotiable());

        if (req.headline() != null) {
            profile.setHeadline(blankToNull(req.headline()));
        }
        if (req.bio() != null) {
            profile.setBio(blankToNull(req.bio()));
        }
        if (req.serviceCategory() != null
                && !req.serviceCategory().isBlank()) {
            profile.setServiceCategory(req.serviceCategory().trim());
        }
        if (req.experienceYears() != null) {
            profile.setExperienceYears(req.experienceYears());
        }
        if (req.city() != null) {
            profile.setCity(blankToNull(req.city()));
        }
        if (req.state() != null) {
            profile.setState(blankToNull(req.state()));
        }
        if (req.pincode() != null) {
            profile.setPincode(blankToNull(req.pincode()));
        }
        if (req.availabilityStatus() != null) {
            profile.setAvailabilityStatus(req.availabilityStatus().toUpperCase(Locale.ROOT));
        }
        if (req.workingDaysJson() != null) {
            profile.setWorkingDaysJson(validJsonObject(req.workingDaysJson()));
        }
        if (req.startingPrice() != null) {
            profile.setStartingPrice(req.startingPrice());
        }

        users.save(user);
        return ResponseEntity.ok(
                WorkerProfileResponse.from(workers.save(profile)));
    }

    /** Return portfolio items for the authenticated worker. */
    @GetMapping("/me/portfolio")
    public ResponseEntity<?> myPortfolio(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        AppUser user = workerFromToken(authorization);
        if (user == null) return unauthorized();

        WorkerProfile profile = workers.findByUserId(user.getId()).orElse(null);
        if (profile == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Worker profile not found"));

        return ResponseEntity.ok(portfolios.findByWorker_IdOrderByCreatedAtDesc(profile.getId())
                .stream().map(this::portfolioResponse).toList());
    }

    /** Save a portfolio item against the authenticated worker profile. */
    @PostMapping("/me/portfolio")
    public ResponseEntity<?> addPortfolio(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody Map<String, Object> request) {
        AppUser user = workerFromToken(authorization);
        if (user == null) return unauthorized();

        WorkerProfile profile = workers.findByUserId(user.getId()).orElse(null);
        if (profile == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Worker profile not found"));

        String title = request.get("title") == null ? "" : request.get("title").toString().trim();
        String category = request.get("category") == null ? "" : request.get("category").toString().trim();
        if (title.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "Portfolio title is required."));
        if (title.length() > 160) return ResponseEntity.badRequest().body(Map.of("message", "Portfolio title must be 160 characters or fewer."));
        if (category.isBlank()) category = profile.getServiceCategory() == null ? "Home Services" : profile.getServiceCategory();

        WorkerPortfolioItem item = new WorkerPortfolioItem();
        item.setWorker(profile);
        item.setTitle(title);
        item.setCategory(category.length() > 100 ? category.substring(0, 100) : category);
        item.setDescription(request.get("description") == null ? null : request.get("description").toString().trim());
        item.setImageUrl(request.get("image_url") == null || request.get("image_url").toString().isBlank()
                ? null : request.get("image_url").toString().trim());
        Object completedDate = request.get("completed_date");
        if (completedDate != null && !completedDate.toString().isBlank()) {
            try {
                item.setCompletedDate(LocalDate.parse(completedDate.toString()));
            } catch (java.time.format.DateTimeParseException ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Completed date must use YYYY-MM-DD format."));
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioResponse(portfolios.save(item)));
    }

    /** Delete only a portfolio item owned by the authenticated worker. */
    @DeleteMapping("/me/portfolio/{id}")
    public ResponseEntity<?> deletePortfolio(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @PathVariable Long id) {
        AppUser user = workerFromToken(authorization);
        if (user == null) return unauthorized();

        WorkerProfile profile = workers.findByUserId(user.getId()).orElse(null);
        if (profile == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Worker profile not found"));

        WorkerPortfolioItem item = portfolios.findByIdAndWorker_Id(id, profile.getId()).orElse(null);
        if (item == null) return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", "Portfolio item not found"));

        portfolios.delete(item);
        return ResponseEntity.noContent().build();
    }

    private Map<String, Object> portfolioResponse(WorkerPortfolioItem item) {
        Map<String, Object> result = new java.util.LinkedHashMap<>();
        result.put("id", item.getId());
        result.put("worker_id", item.getWorker().getId());
        result.put("title", item.getTitle());
        result.put("description", item.getDescription());
        result.put("image_url", item.getImageUrl());
        result.put("category", item.getCategory());
        result.put("completed_date", item.getCompletedDate() == null ? null : item.getCompletedDate().toString());
        return result;
    }

    private boolean scheduleHasEnabledDay(String schedule, String day) {
        if (schedule == null || schedule.isBlank()) return false;
        try {
            tools.jackson.databind.JsonNode root = new tools.jackson.databind.ObjectMapper().readTree(schedule);
            return root.path(day).path("enabled").asBoolean(false);
        } catch (Exception ex) { return false; }
    }

    private boolean scheduleHasAnyEnabledDay(String schedule) {
        if (schedule == null || schedule.isBlank()) return false;
        try {
            tools.jackson.databind.JsonNode root = new tools.jackson.databind.ObjectMapper().readTree(schedule);
            java.util.Iterator<tools.jackson.databind.JsonNode> days = root.iterator();
            while (days.hasNext()) if (days.next().path("enabled").asBoolean(false)) return true;
        } catch (Exception ignored) { }
        return false;
    }

    private String validJsonObject(String value) {
        if (value == null || value.isBlank()) return "{}";
        try {
            tools.jackson.databind.JsonNode node = new tools.jackson.databind.ObjectMapper().readTree(value);
            return node.isObject() ? node.toString() : "{}";
        } catch (Exception ex) {
            return "{}";
        }
    }

    private AppUser workerFromToken(String authorization) {
        Long id = tokens.userIdFromAuthorization(authorization);

        if (id == null) {
            return null;
        }

        return users.findById(id)
                .filter(user -> "WORKER".equalsIgnoreCase(user.getRole()))
                .orElse(null);
    }

    private String generateWorkerCode() {
        String code;

        do {
            code = "HSW-" + (10000 + random.nextInt(90000));
        } while (workers.existsByWorkerCode(code));

        return code;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

private String validJsonArray(String value) {
    if (value == null || value.isBlank()) {
        return "[]";
    }

    try {
        tools.jackson.databind.JsonNode node =
                new tools.jackson.databind.ObjectMapper().readTree(value);

        if (node != null && node.isArray()) {
            return value;
        }
    } catch (tools.jackson.core.JacksonException ignored) {
        // Invalid JSON is replaced with an empty array.
    }

    return "[]";
}

    private ResponseEntity<Map<String, String>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "message",
                        "Worker session missing or expired. Please sign in again."));
    }
}
