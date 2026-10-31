package com.homeserve.repository;
import com.homeserve.model.BookingMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface BookingMessageRepository extends JpaRepository<BookingMessage, Long> {
    List<BookingMessage> findByBookingIdOrderByCreatedAtAsc(Long bookingId);
    List<BookingMessage> findByBookingIdInOrderByCreatedAtAsc(List<Long> bookingIds);
}
