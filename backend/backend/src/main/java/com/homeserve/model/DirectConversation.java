package com.homeserve.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "direct_conversations",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_direct_conversation_customer_worker",
        columnNames = {"customer_id", "worker_id"}
    ),
    indexes = {
        @Index(name = "idx_direct_conversation_customer_created", columnList = "customer_id, created_at"),
        @Index(name = "idx_direct_conversation_worker_created", columnList = "worker_id, created_at")
    }
)
public class DirectConversation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;

    @Column(name = "worker_id", nullable = false)
    private Long workerId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public DirectConversation() {}
    public Long getId() { return id; }
    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long value) { customerId = value; }
    public Long getWorkerId() { return workerId; }
    public void setWorkerId(Long value) { workerId = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
