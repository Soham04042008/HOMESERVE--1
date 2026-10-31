package com.homeserve.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalDate;

/** Worker-specific information. The account credentials and role remain in users. */
@Entity
@Table(name = "worker_profiles", uniqueConstraints = @UniqueConstraint(columnNames = "worker_code"))
public class WorkerProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false, fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private AppUser user;

    @Column(name = "worker_code", nullable = false, unique = true, length = 24)
    private String workerCode;
    @Column(length = 120) private String headline;
    @Column(length = 2000) private String bio;
    @Column(length = 100) private String serviceCategory;
    @Column(nullable = false) private Integer experienceYears = 0;
    @Column(length = 255) private String address;
    @Column(length = 500) private String avatarUrl;
    private LocalDate dateOfBirth;
    @Column(length = 30) private String gender;
    @Column(columnDefinition = "TEXT") private String preferredAreasJson = "[]";
    @Column(columnDefinition = "TEXT") private String languagesJson = "[]";
    @Column(columnDefinition = "TEXT") private String workingDaysJson = "{}";
    @Column(nullable = false) private Integer minPrice = 0;
    @Column(nullable = false) private Integer maxPrice = 0;
    @Column(length = 30) private String pricingType = "Fixed Price";
    @Column(nullable = false) private Integer visitCharge = 0;
    @Column(nullable = false) private Boolean negotiable = false;
    @Column(columnDefinition = "TEXT") private String additionalChargesJson = "[]";
    @Column(length = 100) private String city;
    @Column(length = 100) private String state;
    @Column(length = 12) private String pincode;
    @Column(nullable = false, length = 20) private String verificationStatus = "PENDING";
    @Column(nullable = false, length = 20) private String availabilityStatus = "AVAILABLE";
    @Column(nullable = false) private Integer startingPrice = 0;
    @Column(nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
    @Column(nullable = false) private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate public void onUpdate() { updatedAt = LocalDateTime.now(); }
    public WorkerProfile() {}
    public Long getId() { return id; }
    public AppUser getUser() { return user; }
    public void setUser(AppUser user) { this.user = user; }
    public String getWorkerCode() { return workerCode; }
    public void setWorkerCode(String workerCode) { this.workerCode = workerCode; }
    public String getHeadline() { return headline; }
    public void setHeadline(String headline) { this.headline = headline; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getServiceCategory() { return serviceCategory; }
    public void setServiceCategory(String serviceCategory) { this.serviceCategory = serviceCategory; }
    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public LocalDate getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(LocalDate dateOfBirth) { this.dateOfBirth = dateOfBirth; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPreferredAreasJson() { return preferredAreasJson; }
    public void setPreferredAreasJson(String preferredAreasJson) { this.preferredAreasJson = preferredAreasJson; }
    public String getLanguagesJson() { return languagesJson; }
    public void setLanguagesJson(String languagesJson) { this.languagesJson = languagesJson; }
    public String getWorkingDaysJson() { return workingDaysJson; }
    public void setWorkingDaysJson(String workingDaysJson) { this.workingDaysJson = workingDaysJson; }
    public Integer getMinPrice() { return minPrice; }
    public void setMinPrice(Integer minPrice) { this.minPrice = minPrice; }
    public Integer getMaxPrice() { return maxPrice; }
    public void setMaxPrice(Integer maxPrice) { this.maxPrice = maxPrice; }
    public String getPricingType() { return pricingType; }
    public void setPricingType(String pricingType) { this.pricingType = pricingType; }
    public Integer getVisitCharge() { return visitCharge; }
    public void setVisitCharge(Integer visitCharge) { this.visitCharge = visitCharge; }
    public Boolean getNegotiable() { return negotiable; }
    public void setNegotiable(Boolean negotiable) { this.negotiable = negotiable; }
    public String getAdditionalChargesJson() { return additionalChargesJson; }
    public void setAdditionalChargesJson(String additionalChargesJson) { this.additionalChargesJson = additionalChargesJson; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String status) { this.verificationStatus = status; }
    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String status) { this.availabilityStatus = status; }
    public Integer getStartingPrice() { return startingPrice; }
    public void setStartingPrice(Integer price) { this.startingPrice = price; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
