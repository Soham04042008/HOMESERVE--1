package com.homeserve.controller;

import com.homeserve.model.*;
import com.homeserve.repository.*;
import com.homeserve.service.SessionTokenService;
import com.homeserve.service.NotificationService;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
public class ReviewController {
    private final BookingRepository bookings; private final BookingReviewRepository reviews; private final UserRepository users; private final SessionTokenService tokens; private final NotificationService notifications;
    public ReviewController(BookingRepository b, BookingReviewRepository r, UserRepository u, SessionTokenService t, NotificationService n){bookings=b;reviews=r;users=u;tokens=t;notifications=n;}

    @PostMapping("/api/bookings/{bookingId}/review")
    public ResponseEntity<?> submit(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long bookingId, @RequestBody Map<String,Object> body){
        Long caller=tokens.userIdFromAuthorization(auth); if(caller==null)return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        Booking b=bookings.findById(bookingId).orElse(null); if(b==null)return ResponseEntity.status(404).body(Map.of("message","Booking not found."));
        if(!Objects.equals(caller,b.getUser().getId()))return ResponseEntity.status(403).body(Map.of("message","Only the customer who made this booking can review it."));
        if(!"COMPLETED".equalsIgnoreCase(b.getStatus()))return ResponseEntity.badRequest().body(Map.of("message","You can review a booking only after it is completed."));
        int rating; try { rating=((Number)body.get("rating")).intValue(); } catch(Exception ex){return ResponseEntity.badRequest().body(Map.of("message","Rating must be between 1 and 5."));}
        if(rating<1||rating>5)return ResponseEntity.badRequest().body(Map.of("message","Rating must be between 1 and 5."));
        String comment=Objects.toString(body.get("comment"),"").trim(); if(comment.isEmpty()||comment.length()>1200)return ResponseEntity.badRequest().body(Map.of("message","Review must contain 1 to 1200 characters."));
        boolean firstReview = reviews.findByBookingId(bookingId).isEmpty();
        BookingReview r=reviews.findByBookingId(bookingId).orElseGet(BookingReview::new);
        r.setBookingId(bookingId);
        r.setCustomerId(caller);
        r.setCustomerName(users.findById(caller).map(AppUser::getFullName).filter(n -> n != null && !n.isBlank()).orElse("Customer"));
        r.setWorkerId(b.getWorkerId());
        r.setServiceName(b.getService() != null && b.getService().getName() != null && !b.getService().getName().isBlank() ? b.getService().getName() : "Home service");
        r.setRating(rating);
        r.setComment(comment);
        BookingReview saved=reviews.save(r);
        if(firstReview && b.getWorkerId()!=null) notifications.create(b.getWorkerId(), "review", "New customer review", r.getCustomerName()+" left a review for "+r.getServiceName()+".", bookingId);
        return ResponseEntity.status(HttpStatus.CREATED).body(reviewMap(saved));
    }

    @GetMapping("/api/bookings/{bookingId}/review")
    public ResponseEntity<?> bookingReview(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long bookingId){
        Long caller=tokens.userIdFromAuthorization(auth); if(caller==null)return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        Booking b=bookings.findById(bookingId).orElse(null); if(b==null)return ResponseEntity.status(404).body(Map.of("message","Booking not found."));
        if(!Objects.equals(caller,b.getUser().getId())&&!Objects.equals(caller,b.getWorkerId()))return ResponseEntity.status(403).body(Map.of("message","You cannot view this review."));
        return reviews.findByBookingId(bookingId).<ResponseEntity<?>>map(r->ResponseEntity.ok(reviewMap(r))).orElseGet(()->ResponseEntity.noContent().build());
    }

    @GetMapping("/api/workers/{workerId}/reviews")
    public ResponseEntity<?> publicWorkerReviews(@PathVariable Long workerId){return ResponseEntity.ok(reviews.findByWorkerIdOrderByCreatedAtDesc(workerId).stream().map(this::reviewMap).toList());}

    /** Batch review lookup used by Find Pros to avoid one HTTP request per worker. */
    @GetMapping("/api/workers/reviews/batch")
    public ResponseEntity<?> batchWorkerReviews(@RequestParam("workerIds") List<Long> workerIds) {
        if (workerIds == null || workerIds.isEmpty()) return ResponseEntity.ok(Map.of());
        if (workerIds.size() > 100) return ResponseEntity.badRequest().body(Map.of("message", "A maximum of 100 worker IDs is allowed."));
        Map<Long, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        for (Long workerId : workerIds) grouped.put(workerId, new ArrayList<>());
        for (BookingReview review : reviews.findByWorkerIdInOrderByCreatedAtDesc(workerIds.stream().distinct().toList())) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", review.getId());
            item.put("rating", review.getRating());
            item.put("comment", review.getComment());
            item.put("customer_name", review.getCustomerName() == null ? "Customer" : review.getCustomerName());
            item.put("service_name", review.getServiceName() == null ? "Home service" : review.getServiceName());
            item.put("created_at", review.getCreatedAt());
            grouped.computeIfAbsent(review.getWorkerId(), ignored -> new ArrayList<>()).add(item);
        }
        return ResponseEntity.ok(grouped);
    }

    @GetMapping("/api/workers/me/reviews")
    public ResponseEntity<?> workerReviews(@RequestHeader(value="Authorization", required=false) String auth){
        Long caller=tokens.userIdFromAuthorization(auth); AppUser u=caller==null?null:users.findById(caller).orElse(null);
        if(u==null||!"WORKER".equalsIgnoreCase(u.getRole()))return ResponseEntity.status(401).body(Map.of("message","Worker login required."));
        return ResponseEntity.ok(reviews.findByWorkerIdOrderByCreatedAtDesc(caller).stream().map(this::reviewMap).toList());
    }

    public Map<String,Object> reviewMap(BookingReview r){
        // Review rows already store customerName and serviceName. Only perform
        // fallback lookups for legacy rows where those denormalized values are absent.
        String customerName = r.getCustomerName();
        if (customerName == null || customerName.isBlank()) {
            AppUser customer = users.findById(r.getCustomerId()).orElse(null);
            customerName = customer == null || customer.getFullName() == null ? "Customer" : customer.getFullName();
        }
        String serviceName = r.getServiceName();
        if (serviceName == null || serviceName.isBlank()) {
            Booking booking = bookings.findById(r.getBookingId()).orElse(null);
            serviceName = booking == null || booking.getService() == null || booking.getService().getName() == null
                    ? "Home service" : booking.getService().getName();
        }
        Map<String,Object> m=new LinkedHashMap<>();
        m.put("id",r.getId()); m.put("bookingId",r.getBookingId()); m.put("workerId",r.getWorkerId());
        m.put("customerId",r.getCustomerId());
        m.put("customerName",customerName);
        m.put("rating",r.getRating()); m.put("comment",r.getComment());
        m.put("serviceName",serviceName);
        m.put("createdAt",r.getCreatedAt());
        return m;
    }
}
