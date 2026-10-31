package com.homeserve.repository;

import com.homeserve.model.WorkerServiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkerServiceRepository extends JpaRepository<WorkerServiceEntity, Long> {
    List<WorkerServiceEntity> findByWorkerIdOrderByIdDesc(Long workerId);
    List<WorkerServiceEntity> findByWorkerIdInOrderByIdDesc(List<Long> workerIds);
    Optional<WorkerServiceEntity> findByIdAndWorkerId(Long id, Long workerId);
}
