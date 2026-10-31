package com.homeserve.dto;
import jakarta.validation.constraints.*;
public record WorkerRegisterRequest(
 @NotBlank @Size(max=100) String fullName,
 @NotBlank @Email @Size(max=150) String email,
 @NotBlank @Size(min=8,max=72) String password,
 @Size(max=20) String phone,
 @NotBlank @Size(max=100) String serviceCategory,
 @Min(0) @Max(60) Integer experienceYears,
 @Size(max=100) String city,
 @Size(max=100) String state,
 @Size(max=12) String pincode
) {}
