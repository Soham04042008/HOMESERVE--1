package com.homeserve.repository;

import com.homeserve.model.DirectMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DirectMessageRepository extends JpaRepository<DirectMessage, Long> {
    List<DirectMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    List<DirectMessage> findByConversationIdInOrderByCreatedAtAsc(List<Long> conversationIds);
}
