package com.homeserve.dto;

import com.homeserve.model.WorkerQualification;

public record WorkerQualificationResponse(
    Long id, String type, String title, String institution, Integer year, String description
) {
    public static WorkerQualificationResponse from(WorkerQualification q) {
        return new WorkerQualificationResponse(q.getId(), q.getType(), q.getTitle(),
            q.getInstitution(), q.getYear(), q.getDescription());
    }
}
