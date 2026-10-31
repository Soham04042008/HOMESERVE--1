package com.homeserve.service;

import com.homeserve.model.AppNotification;
import com.homeserve.repository.AppNotificationRepository;
import org.springframework.stereotype.Service;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class NotificationService {
    private final AppNotificationRepository repository;
    public NotificationService(AppNotificationRepository repository){this.repository=repository;}
    public void create(Long userId,String type,String title,String message,Long bookingId){
        if(userId==null) return;
        AppNotification n=new AppNotification(); n.setUserId(userId); n.setType(type); n.setTitle(title); n.setMessage(message); n.setBookingId(bookingId); repository.save(n);
    }
    public Map<String,Object> toMap(AppNotification n){
        Map<String,Object> m=new LinkedHashMap<>(); m.put("id",n.getId()); m.put("type",n.getType()); m.put("title",n.getTitle()); m.put("message",n.getMessage()); m.put("bookingId",n.getBookingId()); m.put("read",n.isRead()); m.put("createdAt",n.getCreatedAt()); return m;
    }
}
