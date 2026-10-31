package com.homeserve.repository;
import com.homeserve.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.List;
public interface BookingRepository extends JpaRepository<Booking,Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByWorkerIdOrderByCreatedAtDesc(Long workerId);
    List<Booking> findByWorkerIdAndStatusIn(Long workerId, List<String> statuses);
    List<Booking> findByWorkerIdAndBookingDateAndStatusIn(Long workerId, java.time.LocalDate bookingDate, List<String> statuses);
    List<Booking> findByWorkerIdAndBookingDateAndBookingTimeAndStatusIn(Long workerId, java.time.LocalDate bookingDate, java.time.LocalTime bookingTime, List<String> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.workerId = :workerId and b.bookingDate = :bookingDate and b.bookingTime = :bookingTime and b.status in :statuses")
    List<Booking> findConflictsForUpdate(@Param("workerId") Long workerId,
                                         @Param("bookingDate") java.time.LocalDate bookingDate,
                                         @Param("bookingTime") java.time.LocalTime bookingTime,
                                         @Param("statuses") List<String> statuses);
    List<Booking> findByWorkerIdInAndStatusIn(List<Long> workerIds, List<String> statuses);
}
