package com.homeserve.repository;

import com.homeserve.model.WorkerPortfolioItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WorkerPortfolioRepository extends JpaRepository<WorkerPortfolioItem, Long> {
    List<WorkerPortfolioItem> findByWorker_IdOrderByCreatedAtDesc(Long workerId);
    Optional<WorkerPortfolioItem> findByIdAndWorker_Id(Long id, Long workerId);
}
