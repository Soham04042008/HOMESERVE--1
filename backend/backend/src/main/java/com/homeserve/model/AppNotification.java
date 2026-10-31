package com.homeserve.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name="app_notifications", indexes={
    @Index(name="idx_app_notifications_user_created", columnList="user_id, created_at"),
    @Index(name="idx_app_notifications_user_read", columnList="user_id, is_read")
})
public class AppNotification {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(name="user_id", nullable=false) private Long userId;
    @Column(nullable=false, length=30) private String type;
    @Column(nullable=false, length=160) private String title;
    @Column(nullable=false, length=600) private String message;
    @Column(name="booking_id") private Long bookingId;
    @Column(name="is_read", nullable=false) private boolean read=false;
    @Column(name="created_at", nullable=false) private LocalDateTime createdAt=LocalDateTime.now();
    public AppNotification() {}
    public Long getId(){return id;} public Long getUserId(){return userId;} public void setUserId(Long v){userId=v;}
    public String getType(){return type;} public void setType(String v){type=v;}
    public String getTitle(){return title;} public void setTitle(String v){title=v;}
    public String getMessage(){return message;} public void setMessage(String v){message=v;}
    public Long getBookingId(){return bookingId;} public void setBookingId(Long v){bookingId=v;}
    public boolean isRead(){return read;} public void setRead(boolean v){read=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
