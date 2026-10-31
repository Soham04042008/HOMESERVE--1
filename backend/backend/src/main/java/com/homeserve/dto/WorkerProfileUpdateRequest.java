package com.homeserve.dto;

import jakarta.validation.constraints.*;

public record WorkerProfileUpdateRequest(
    @Size(max=100) String fullName,
    @Email @Size(max=150) String email,
    @Size(max=20) String phone,
    @Size(max=255) String address,
    @Size(max=500) String avatarUrl,
    String dateOfBirth,
    @Size(max=30) String gender,
    @Size(max=120) String headline,
    @Size(max=2000) String bio,
    @Size(max=100) String serviceCategory,
    @Min(0) @Max(60) Integer experienceYears,
    @Size(max=100) String city,
    @Size(max=100) String state,
    @Size(max=12) String pincode,
    @Pattern(regexp="(?i)AVAILABLE|BUSY|UNAVAILABLE", message="Availability must be AVAILABLE, BUSY, or UNAVAILABLE") String availabilityStatus,
    @Min(0) @Max(1000000) Integer startingPrice,
    @Min(0) @Max(1000000) Integer minPrice,
    @Min(0) @Max(1000000) Integer maxPrice,
    @Size(max=30) String pricingType,
    @Min(0) @Max(1000000) Integer visitCharge,
    Boolean negotiable,
    @Size(max=10000) String preferredAreasJson,
    @Size(max=10000) String languagesJson,
    @Size(max=20000) String additionalChargesJson,
    @Size(max=20000) String workingDaysJson
) {}
