package com.homeserve.dto;

import com.homeserve.model.WorkerProfile;
import com.homeserve.model.AppUser;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record WorkerProfileResponse(
    Long id, Long userId, String workerCode, String fullName, String email, String phone,
    String address, String avatarUrl, LocalDate dateOfBirth, String gender,
    String headline, String bio, String serviceCategory, Integer experienceYears,
    String city, String state, String pincode, String preferredAreasJson, String languagesJson,
    String verificationStatus, String availabilityStatus, Integer startingPrice,
    Integer minPrice, Integer maxPrice, String pricingType, Integer visitCharge,
    Boolean negotiable, String additionalChargesJson, String workingDaysJson, LocalDateTime createdAt, LocalDateTime updatedAt
) {
    public static WorkerProfileResponse from(WorkerProfile p) {
        AppUser u = p.getUser();
        return new WorkerProfileResponse(
            p.getId(), u.getId(), p.getWorkerCode(), u.getFullName(), u.getEmail(), u.getPhone(),
            p.getAddress() != null ? p.getAddress() : u.getAddress(), p.getAvatarUrl(), p.getDateOfBirth(), p.getGender(),
            p.getHeadline(), p.getBio(), p.getServiceCategory(), p.getExperienceYears(),
            p.getCity(), p.getState(), p.getPincode(), p.getPreferredAreasJson(), p.getLanguagesJson(),
            p.getVerificationStatus(), p.getAvailabilityStatus(), p.getStartingPrice(),
            p.getMinPrice(), p.getMaxPrice(), p.getPricingType(), p.getVisitCharge(),
            p.getNegotiable(), p.getAdditionalChargesJson(), p.getWorkingDaysJson(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }
}
