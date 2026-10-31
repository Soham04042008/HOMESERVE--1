package com.homeserve.repository;

import com.homeserve.model.WorkerQualification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkerQualificationRepository extends JpaRepository<WorkerQualification, Long> {
    List<WorkerQualification> findByWorkerProfileIdOrderByIdAsc(Long workerProfileId);
    Optional<WorkerQualification> findByIdAndWorkerProfileId(Long id, Long workerProfileId);
}
