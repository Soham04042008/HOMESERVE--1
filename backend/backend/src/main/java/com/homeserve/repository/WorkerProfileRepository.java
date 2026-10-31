package com.homeserve.repository;
import com.homeserve.model.WorkerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;
import java.util.Optional;
public interface WorkerProfileRepository extends JpaRepository<WorkerProfile, Long> {
    @Override
    @EntityGraph(attributePaths = "user")
    List<WorkerProfile> findAll();
    Optional<WorkerProfile> findByUserId(Long userId);
    boolean existsByWorkerCode(String workerCode);
}
