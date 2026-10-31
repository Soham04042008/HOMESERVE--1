package com.homeserve.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_reviews", uniqueConstraints = @UniqueConstraint(name = "uk_booking_review_booking", columnNames = "booking_id"), indexes = @Index(name = "idx_booking_reviews_worker", columnList = "worker_id, created_at"))
public class BookingReview {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "booking_id", nullable = false) private Long bookingId;
    @Column(name = "customer_id", nullable = false) private Long customerId;
    @Column(name = "customer_name", nullable = false, length = 255) private String customerName;
    @Column(name = "worker_id", nullable = false) private Long workerId;
    @Column(name = "service_name", nullable = false, length = 180) private String serviceName;
    @Column(nullable = false) private int rating;
    @Column(nullable = false, length = 1200) private String comment;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();

    public BookingReview() {}
    public Long getId(){return id;}
    public Long getBookingId(){return bookingId;} public void setBookingId(Long v){bookingId=v;}
    public Long getCustomerId(){return customerId;} public void setCustomerId(Long v){customerId=v;}
    public String getCustomerName(){return customerName;} public void setCustomerName(String v){customerName=v;}
    public Long getWorkerId(){return workerId;} public void setWorkerId(Long v){workerId=v;}
    public String getServiceName(){return serviceName;} public void setServiceName(String v){serviceName=v;}
    public int getRating(){return rating;} public void setRating(int v){rating=v;}
    public String getComment(){return comment;} public void setComment(String v){comment=v;}
    public LocalDateTime getCreatedAt(){return createdAt;}
}
