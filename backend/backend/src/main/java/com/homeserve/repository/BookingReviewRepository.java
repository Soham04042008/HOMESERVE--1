package com.homeserve.repository;

import com.homeserve.model.BookingReview;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BookingReviewRepository extends JpaRepository<BookingReview, Long> {
    List<BookingReview> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
    List<BookingReview> findByWorkerIdInOrderByCreatedAtDesc(List<Long> workerIds);
    List<BookingReview> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    Optional<BookingReview> findByBookingId(Long bookingId);
    long countByWorkerId(Long workerId);
}
