package com.homeserve.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "direct_messages", indexes = {
    @Index(name = "idx_direct_messages_conversation_created", columnList = "conversation_id, created_at")
})
public class DirectMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    @Column(name = "sender_role", nullable = false, length = 20)
    private String senderRole;

    @Column(nullable = false, length = 2000)
    private String content;

    @Column(name = "read_by_customer", nullable = false)
    private boolean readByCustomer = false;

    @Column(name = "read_by_worker", nullable = false)
    private boolean readByWorker = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public DirectMessage() {}
    public Long getId() { return id; }
    public Long getConversationId() { return conversationId; }
    public void setConversationId(Long value) { conversationId = value; }
    public Long getSenderId() { return senderId; }
    public void setSenderId(Long value) { senderId = value; }
    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String value) { senderRole = value; }
    public String getContent() { return content; }
    public void setContent(String value) { content = value; }
    public boolean isReadByCustomer() { return readByCustomer; }
    public void setReadByCustomer(boolean value) { readByCustomer = value; }
    public boolean isReadByWorker() { return readByWorker; }
    public void setReadByWorker(boolean value) { readByWorker = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
