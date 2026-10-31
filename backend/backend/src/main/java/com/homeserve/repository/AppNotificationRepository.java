package com.homeserve.repository;
import com.homeserve.model.AppNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
public interface AppNotificationRepository extends JpaRepository<AppNotification,Long> {
    List<AppNotification> findTop100ByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<AppNotification> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndReadFalse(Long userId);
    @Modifying
    @Query("update AppNotification n set n.read = true where n.userId = :userId and n.read = false")
    int markAllReadForUser(@Param("userId") Long userId);
}
