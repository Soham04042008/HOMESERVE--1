package com.homeserve.controller;

import com.homeserve.model.AppNotification;
import com.homeserve.repository.AppNotificationRepository;
import com.homeserve.service.NotificationService;
import com.homeserve.service.SessionTokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final AppNotificationRepository notifications;
    private final NotificationService mapper;
    private final SessionTokenService tokens;
    public NotificationController(AppNotificationRepository n, NotificationService m, SessionTokenService t){notifications=n;mapper=m;tokens=t;}
    @GetMapping("/me")
    public ResponseEntity<?> mine(@RequestHeader(value="Authorization",required=false) String auth){
        Long userId=tokens.userIdFromAuthorization(auth); if(userId==null)return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        List<AppNotification> rows=notifications.findTop100ByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(Map.of("items",rows.stream().map(mapper::toMap).toList(),"unreadCount",notifications.countByUserIdAndReadFalse(userId)));
    }
    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@RequestHeader(value="Authorization",required=false) String auth){
        Long userId=tokens.userIdFromAuthorization(auth);
        if(userId==null)return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        return ResponseEntity.ok(Map.of("unreadCount", notifications.countByUserIdAndReadFalse(userId)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@RequestHeader(value="Authorization",required=false) String auth,@PathVariable Long id){
        Long userId=tokens.userIdFromAuthorization(auth); if(userId==null)return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        AppNotification n=notifications.findByIdAndUserId(id,userId).orElse(null); if(n==null)return ResponseEntity.notFound().build(); n.setRead(true); notifications.save(n); return ResponseEntity.noContent().build();
    }
    @PatchMapping("/read-all")
    @Transactional
    public ResponseEntity<?> markAll(@RequestHeader(value="Authorization",required=false) String auth){
        Long userId=tokens.userIdFromAuthorization(auth); if(userId==null)return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        notifications.markAllReadForUser(userId); return ResponseEntity.noContent().build();
    }
}
