package com.homeserve.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
public record ServiceRequest(@NotBlank @Size(max=120) String name, @NotBlank @Size(max=80) String category,
 @Size(max=1000) String description, @NotNull @DecimalMin("0.00") BigDecimal price, String imageUrl, Boolean active) {}
