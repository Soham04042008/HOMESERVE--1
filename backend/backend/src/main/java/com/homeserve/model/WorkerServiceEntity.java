package com.homeserve.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "worker_services", indexes = @Index(name = "idx_worker_services_worker_id", columnList = "worker_id"))
public class WorkerServiceEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    @Column(nullable = false, length = 120) private String name;
    @Column(nullable = false, length = 80) private String category;
    @Column(columnDefinition = "TEXT") private String skills;
    @Column(length = 1000) private String description;
    @Column(name = "experience_years", nullable = false) private int experienceYears;
    @Column(length = 255) private String qualification;
    @Column(length = 500) private String tools;
    @Column(name = "service_areas", columnDefinition = "TEXT") private String serviceAreas;
    @Column(name = "emergency_available", nullable = false) private boolean emergencyAvailable;
    @Column(name = "min_price", nullable = false, precision = 10, scale = 2) private BigDecimal minPrice = BigDecimal.ZERO;
    @Column(name = "max_price", nullable = false, precision = 10, scale = 2) private BigDecimal maxPrice = BigDecimal.ZERO;
    @Column(name = "pricing_type", nullable = false, length = 40) private String pricingType = "Fixed Price";
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long workerId) { this.workerId = workerId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public int getExperienceYears() { return experienceYears; }
    public void setExperienceYears(int experienceYears) { this.experienceYears = experienceYears; }
    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }
    public String getTools() { return tools; }
    public void setTools(String tools) { this.tools = tools; }
    public String getServiceAreas() { return serviceAreas; }
    public void setServiceAreas(String serviceAreas) { this.serviceAreas = serviceAreas; }
    public boolean isEmergencyAvailable() { return emergencyAvailable; }
    public void setEmergencyAvailable(boolean emergencyAvailable) { this.emergencyAvailable = emergencyAvailable; }
    public BigDecimal getMinPrice() { return minPrice; }
    public void setMinPrice(BigDecimal minPrice) { this.minPrice = minPrice; }
    public BigDecimal getMaxPrice() { return maxPrice; }
    public void setMaxPrice(BigDecimal maxPrice) { this.maxPrice = maxPrice; }
    public String getPricingType() { return pricingType; }
    public void setPricingType(String pricingType) { this.pricingType = pricingType; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
