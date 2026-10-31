package com.homeserve.repository;

import com.homeserve.model.DirectConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DirectConversationRepository extends JpaRepository<DirectConversation, Long> {
    Optional<DirectConversation> findByCustomerIdAndWorkerId(Long customerId, Long workerId);
    List<DirectConversation> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<DirectConversation> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
}
