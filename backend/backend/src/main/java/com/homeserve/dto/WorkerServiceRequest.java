package com.homeserve.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public record WorkerServiceRequest(
    @NotBlank @Size(max = 120) String name,
    @NotBlank @Size(max = 80) String category,
    List<String> skills,
    @Size(max = 1000) String description,
    @Min(0) int experienceYears,
    @Size(max = 255) String qualification,
    @Size(max = 500) String tools,
    List<String> serviceAreas,
    boolean emergencyAvailable,
    @NotNull @DecimalMin("0.00") BigDecimal minPrice,
    @NotNull @DecimalMin("0.00") BigDecimal maxPrice,
    @NotBlank @Size(max = 40) String pricingType
) {}
