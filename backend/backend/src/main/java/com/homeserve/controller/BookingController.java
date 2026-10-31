package com.homeserve.controller;

import com.homeserve.dto.BookingRequest;
import com.homeserve.model.*;
import com.homeserve.repository.*;
import com.homeserve.service.SessionTokenService;
import com.homeserve.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
 private final BookingRepository bookings;
 private final UserRepository users;
 private final HomeServiceRepository services;
 private final WorkerServiceRepository workerServices;
 private final SessionTokenService tokens;
 private final BookingReviewRepository bookingReviews;
 private final NotificationService notifications;

 public BookingController(BookingRepository b, UserRepository u, HomeServiceRepository s,
                          WorkerServiceRepository ws, SessionTokenService t, BookingReviewRepository br, NotificationService ns) {
  bookings=b; users=u; services=s; workerServices=ws; tokens=t; bookingReviews=br; notifications=ns;
 }

 @PostMapping
 @Transactional
 public ResponseEntity<?> create(
   @RequestHeader(value="Authorization", required=false) String authorization,
   @Valid @RequestBody BookingRequest req) {
  Long callerId=tokens.userIdFromAuthorization(authorization);
  if(callerId==null || !callerId.equals(req.userId()))
   return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message","Please sign in again before booking."));
  AppUser user=users.findById(callerId).orElse(null);
  if(user==null || !("CUSTOMER".equalsIgnoreCase(user.getRole()) || "USER".equalsIgnoreCase(user.getRole())))
   return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message","A customer account is required."));
  AppUser worker=users.findByIdForUpdate(req.workerId()).orElse(null);
  if(worker==null || !"WORKER".equalsIgnoreCase(worker.getRole()))
   return ResponseEntity.badRequest().body(Map.of("message","Selected worker was not found."));
  if (LocalDateTime.of(req.bookingDate(), req.bookingTime()).isBefore(LocalDateTime.now()))
   return ResponseEntity.badRequest().body(Map.of("message","Choose a future date and time."));

  List<String> activeStatuses = List.of("PENDING", "CONFIRMED", "IN_PROGRESS");
  boolean slotTaken = !bookings.findConflictsForUpdate(
      req.workerId(), req.bookingDate(), req.bookingTime(), activeStatuses).isEmpty();
  if (slotTaken)
   return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","This worker has already been booked for that date and time. Please choose another slot."));

  WorkerServiceEntity ws=workerServices.findByIdAndWorkerId(req.workerServiceId(), req.workerId()).orElse(null);
  if(ws==null) return ResponseEntity.badRequest().body(Map.of("message","Selected service does not belong to this worker."));
  String category=ws.getCategory()==null ? "" : ws.getCategory().trim();
  HomeService service=services.findByActiveTrueOrderByNameAsc().stream()
      .filter(candidate -> sameCategory(candidate.getCategory(), category)).findFirst().orElse(null);
  if(service==null)
   return ResponseEntity.badRequest().body(Map.of("message","No active catalogue service matches this worker's category. Add an active service in the services table for category: "+category));
  BigDecimal price=ws.getMinPrice()==null ? service.getPrice() : ws.getMinPrice();
  if(price==null || price.signum()<0) return ResponseEntity.badRequest().body(Map.of("message","Service price is invalid."));
  Booking b=new Booking();
  b.setUser(user); b.setService(service); b.setWorkerId(worker.getId()); b.setWorkerServiceId(ws.getId()); b.setAgreedPrice(price);
  b.setBookingDate(req.bookingDate()); b.setBookingTime(req.bookingTime()); b.setAddress(req.address().trim()); b.setNotes(req.notes()==null?null:req.notes().trim());
  Booking saved=bookings.save(b);
  notifications.create(worker.getId(), "booking", "New booking request", user.getFullName()+" requested "+service.getName()+".", saved.getId());
  return ResponseEntity.status(HttpStatus.CREATED).body(toMap(saved));
 }

 @GetMapping("/availability/{workerId}")
 public ResponseEntity<?> availability(@PathVariable Long workerId, @RequestParam("date") String dateText) {
  try {
   LocalDate date = LocalDate.parse(dateText);
   List<String> activeStatuses = List.of("PENDING", "CONFIRMED", "IN_PROGRESS");
   List<String> bookedTimes = bookings.findByWorkerIdAndBookingDateAndStatusIn(workerId, date, activeStatuses)
       .stream().map(b -> b.getBookingTime().withSecond(0).withNano(0).toString()).distinct().toList();
   return ResponseEntity.ok(Map.of("bookedTimes", bookedTimes));
  } catch (Exception ex) {
   return ResponseEntity.badRequest().body(Map.of("message","Enter a valid date."));
  }
 }

 @GetMapping("/user/{userId}")
 public ResponseEntity<?> byUser(@RequestHeader(value="Authorization", required=false) String authorization, @PathVariable Long userId){
  Long callerId=tokens.userIdFromAuthorization(authorization);
  if(callerId==null || !callerId.equals(userId)) return ResponseEntity.status(401).body(Map.of("message","Not authorized to view these bookings."));
  return ResponseEntity.ok(bookings.findByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toMap).toList());
 }

 @GetMapping("/worker/{workerId}")
 public ResponseEntity<?> byWorker(@RequestHeader(value="Authorization", required=false) String authorization, @PathVariable Long workerId){
  Long callerId=tokens.userIdFromAuthorization(authorization);
  AppUser caller=callerId==null?null:users.findById(callerId).orElse(null);
  if(caller==null || !callerId.equals(workerId) || !"WORKER".equalsIgnoreCase(caller.getRole()))
   return ResponseEntity.status(401).body(Map.of("message","Worker login required."));
  return ResponseEntity.ok(bookings.findByWorkerIdOrderByCreatedAtDesc(workerId).stream().map(this::toMap).toList());
 }

 @PatchMapping("/{id}/reschedule")
 @Transactional
 public ResponseEntity<?> reschedule(@RequestHeader(value="Authorization", required=false) String authorization,
                                     @PathVariable Long id, @RequestBody Map<String,String> body) {
  Long callerId=tokens.userIdFromAuthorization(authorization);
  if (callerId == null) return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
  Booking b=bookings.findById(id).orElse(null);
  if (b == null) return ResponseEntity.status(404).body(Map.of("message","Booking not found."));
  if (!Objects.equals(callerId, b.getUser().getId()))
   return ResponseEntity.status(403).body(Map.of("message","Only the customer who created this booking can reschedule it."));
  if (!Set.of("PENDING","CONFIRMED").contains(b.getStatus().toUpperCase(Locale.ROOT)))
   return ResponseEntity.badRequest().body(Map.of("message","Only pending or confirmed bookings can be rescheduled."));
  try {
   java.time.LocalDate date=java.time.LocalDate.parse(body.get("bookingDate"));
   java.time.LocalTime time=java.time.LocalTime.parse(body.get("bookingTime"));
   if (LocalDateTime.of(date,time).isBefore(LocalDateTime.now()))
    return ResponseEntity.badRequest().body(Map.of("message","Choose a future date and time."));
   users.findByIdForUpdate(b.getWorkerId()).orElse(null);
   List<String> activeStatuses = List.of("PENDING", "CONFIRMED", "IN_PROGRESS");
   boolean slotTaken = bookings.findConflictsForUpdate(
       b.getWorkerId(), date, time, activeStatuses).stream().anyMatch(existing -> !existing.getId().equals(b.getId()));
   if (slotTaken)
    return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message","This worker has already been booked for that date and time. Please choose another slot."));
   b.setBookingDate(date);
   b.setBookingTime(time);
   Booking saved=bookings.save(b);
   if(saved.getWorkerId()!=null) notifications.create(saved.getWorkerId(), "booking", "Booking rescheduled", saved.getUser().getFullName()+" changed the appointment time.", saved.getId());
   return ResponseEntity.ok(toMap(saved));
  } catch (Exception ex) {
   return ResponseEntity.badRequest().body(Map.of("message","Enter a valid booking date and time."));
  }
 }

 @PatchMapping("/{id}/status")
 public ResponseEntity<?> status(@RequestHeader(value="Authorization", required=false) String authorization,
                                  @PathVariable Long id, @RequestBody Map<String,String> body){
  Long callerId=tokens.userIdFromAuthorization(authorization);
  AppUser caller=callerId==null?null:users.findById(callerId).orElse(null);
  if(caller==null) return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
  Booking b=bookings.findById(id).orElse(null);
  if(b==null) return ResponseEntity.status(404).body(Map.of("message","Booking not found"));
  String status=body.get("status");
  if(status==null) return ResponseEntity.badRequest().body(Map.of("message","Status is required."));
  status=status.trim().toUpperCase(Locale.ROOT);
  boolean worker="WORKER".equalsIgnoreCase(caller.getRole()) && Objects.equals(callerId,b.getWorkerId());
  boolean customer=("CUSTOMER".equalsIgnoreCase(caller.getRole()) || "USER".equalsIgnoreCase(caller.getRole())) && Objects.equals(callerId,b.getUser().getId());
  if(!worker && !customer) return ResponseEntity.status(403).body(Map.of("message","You cannot update this booking."));
  Set<String> allowed=worker?Set.of("CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"):Set.of("CANCELLED");
  if(!allowed.contains(status)) return ResponseEntity.badRequest().body(Map.of("message","Status is not allowed for this account."));
  if("CONFIRMED".equals(status) && !"PENDING".equalsIgnoreCase(b.getStatus()))
   return ResponseEntity.badRequest().body(Map.of("message","Only pending bookings can be accepted."));
  if("IN_PROGRESS".equals(status) && !"CONFIRMED".equalsIgnoreCase(b.getStatus()))
   return ResponseEntity.badRequest().body(Map.of("message","Only confirmed bookings can be started."));
  if("COMPLETED".equals(status) && !"IN_PROGRESS".equalsIgnoreCase(b.getStatus()))
   return ResponseEntity.badRequest().body(Map.of("message","Only in-progress bookings can be completed."));
  b.setStatus(status);
  if ("COMPLETED".equals(status)) b.setPaymentStatus("PAID");
  Booking saved=bookings.save(b);
  Long recipient=worker ? b.getUser().getId() : b.getWorkerId();
  if(recipient!=null) {
   String title="Booking "+status.toLowerCase(Locale.ROOT).replace("_", " ");
   String detail="Your booking for "+b.getService().getName()+" is now "+status.toLowerCase(Locale.ROOT).replace("_", " ")+".";
   notifications.create(recipient, "booking", title, detail, b.getId());
   if ("COMPLETED".equals(status) && worker && "PAID".equalsIgnoreCase(saved.getPaymentStatus())) {
    notifications.create(recipient, "payment", "Payment marked paid", "Payment for booking HS-"+b.getId()+" has been marked paid.", b.getId());
   }
  }
  return ResponseEntity.ok(toMap(saved));
 }

 private boolean sameCategory(String a, String b) {
  return normalizeCategory(a).equals(normalizeCategory(b));
 }
 private String normalizeCategory(String value) {
  if(value==null) return "";
  String v=value.trim().toLowerCase(Locale.ROOT);
  if(v.equals("electrician") || v.equals("electrical")) return "electrical";
  if(v.equals("plumber") || v.equals("plumbing")) return "plumbing";
  if(v.equals("cleaner") || v.equals("cleaning")) return "cleaning";
  if(v.equals("carpenter") || v.equals("carpentry")) return "carpentry";
  if(v.equals("painter") || v.equals("painting")) return "painting";
  if(v.equals("air conditioning") || v.equals("ac repair")) return "ac repair";
  return v;
 }
 private Map<String,Object> toMap(Booking b) {
  Map<String,Object> m=new LinkedHashMap<>();
  m.put("id",b.getId()); m.put("userId",b.getUser().getId());
  m.put("customerName",b.getUser().getFullName()); m.put("workerId",b.getWorkerId());
   m.put("workerServiceId",b.getWorkerServiceId());
   AppUser worker = b.getWorkerId()==null ? null : users.findById(b.getWorkerId()).orElse(null);
   m.put("workerName", worker==null ? "" : worker.getFullName());
   m.put("workerPhone", worker==null ? null : worker.getPhone());
   m.put("workerEmail", worker==null ? null : worker.getEmail());
  m.put("serviceId",b.getService().getId()); m.put("serviceName",b.getService().getName());
  m.put("category",b.getService().getCategory()); m.put("price",b.getAgreedPrice()==null?b.getService().getPrice():b.getAgreedPrice());
  m.put("bookingDate",b.getBookingDate()); m.put("bookingTime",b.getBookingTime()); m.put("address",b.getAddress());
  m.put("notes",b.getNotes()); m.put("status",b.getStatus()); m.put("paymentStatus", b.getPaymentStatus()); m.put("createdAt",b.getCreatedAt());
  BookingReview review=bookingReviews.findByBookingId(b.getId()).orElse(null);
  m.put("rating", review==null?null:review.getRating()); m.put("reviewText", review==null?null:review.getComment());
  return m;
 }
}
