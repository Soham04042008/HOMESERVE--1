package com.homeserve.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_messages", indexes = { @Index(name="idx_booking_messages_booking", columnList="booking_id, created_at") })
public class BookingMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name="booking_id", nullable=false) private Long bookingId;
    @Column(name="sender_id", nullable=false) private Long senderId;
    @Column(name="sender_role", nullable=false, length=20) private String senderRole;
    @Column(nullable=false, length=2000) private String content;
    @Column(name="read_by_customer", nullable=false) private boolean readByCustomer = false;
    @Column(name="read_by_worker", nullable=false) private boolean readByWorker = false;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt = LocalDateTime.now();
    public BookingMessage() {}
    public Long getId(){return id;} public Long getBookingId(){return bookingId;} public void setBookingId(Long v){bookingId=v;}
    public Long getSenderId(){return senderId;} public void setSenderId(Long v){senderId=v;}
    public String getSenderRole(){return senderRole;} public void setSenderRole(String v){senderRole=v;}
    public String getContent(){return content;} public void setContent(String v){content=v;}
    public boolean isReadByCustomer(){return readByCustomer;} public void setReadByCustomer(boolean v){readByCustomer=v;}
    public boolean isReadByWorker(){return readByWorker;} public void setReadByWorker(boolean v){readByWorker=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
