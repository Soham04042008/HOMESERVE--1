package com.homeserve.model;

import jakarta.persistence.*;

@Entity
@Table(name = "worker_qualifications")
public class WorkerQualification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worker_profile_id", nullable = false)
    private WorkerProfile workerProfile;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(length = 180)
    private String institution;

    private Integer year;

    @Column(length = 2000)
    private String description;

    public WorkerQualification() {}

    public Long getId() { return id; }
    public WorkerProfile getWorkerProfile() { return workerProfile; }
    public void setWorkerProfile(WorkerProfile workerProfile) { this.workerProfile = workerProfile; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getInstitution() { return institution; }
    public void setInstitution(String institution) { this.institution = institution; }
    public Integer getYear() { return year; }
    public void setYear(Integer year) { this.year = year; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
