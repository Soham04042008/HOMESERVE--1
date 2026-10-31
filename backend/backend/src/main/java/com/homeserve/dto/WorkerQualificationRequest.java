package com.homeserve.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WorkerQualificationRequest(
    @NotBlank @Size(max = 30) String type,
    @NotBlank @Size(max = 180) String title,
    @Size(max = 180) String institution,
    @Min(1900) @Max(2100) Integer year,
    @Size(max = 2000) String description
) {}
