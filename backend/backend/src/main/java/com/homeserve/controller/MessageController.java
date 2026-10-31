package com.homeserve.controller;

import com.homeserve.model.*;
import com.homeserve.repository.*;
import com.homeserve.service.SessionTokenService;
import com.homeserve.service.NotificationService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/messages")
public class MessageController {
    private final BookingRepository bookings;
    private final BookingMessageRepository messages;
    private final UserRepository users;
    private final SessionTokenService tokens;
    private final DirectConversationRepository directConversations;
    private final DirectMessageRepository directMessages;
    private final NotificationService notifications;

    public MessageController(BookingRepository b, BookingMessageRepository m, UserRepository u,
            SessionTokenService t, DirectConversationRepository dc, DirectMessageRepository dm, NotificationService ns) {
        bookings = b;
        messages = m;
        users = u;
        tokens = t;
        directConversations = dc;
        directMessages = dm;
        notifications = ns;
    }

    @GetMapping("/conversations/customer/{userId}")
    public ResponseEntity<?> customerConversations(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long userId) {
        Long caller=tokens.userIdFromAuthorization(auth);
        if(caller==null || !caller.equals(userId)) return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        AppUser u=users.findById(caller).orElse(null); if(u==null || !("CUSTOMER".equalsIgnoreCase(u.getRole()) || "USER".equalsIgnoreCase(u.getRole()))) return ResponseEntity.status(403).body(Map.of("message","Customer account required."));
        return ResponseEntity.ok(conversationMaps(bookings.findByUserIdOrderByCreatedAtDesc(userId), true));
    }

    @GetMapping("/conversations/worker/{workerId}")
    public ResponseEntity<?> workerConversations(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long workerId) {
        Long caller=tokens.userIdFromAuthorization(auth); AppUser u=caller==null?null:users.findById(caller).orElse(null);
        if(u==null || !caller.equals(workerId) || !"WORKER".equalsIgnoreCase(u.getRole())) return ResponseEntity.status(401).body(Map.of("message","Worker login required."));
        return ResponseEntity.ok(conversationMaps(bookings.findByWorkerIdOrderByCreatedAtDesc(workerId), false));
    }

    @GetMapping("/bookings/{bookingId}")
    @Transactional
    public ResponseEntity<?> getMessages(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long bookingId) {
        Long caller=tokens.userIdFromAuthorization(auth); Booking b=bookings.findById(bookingId).orElse(null);
        if(caller==null) return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        if(b==null) return ResponseEntity.status(404).body(Map.of("message","Booking not found."));
        if(!isParticipant(caller,b)) return ResponseEntity.status(403).body(Map.of("message","You cannot view this conversation."));
        boolean customer=Objects.equals(caller,b.getUser().getId());
        List<BookingMessage> rows=messages.findByBookingIdOrderByCreatedAtAsc(bookingId);
        rows.stream().filter(m -> customer && "WORKER".equalsIgnoreCase(m.getSenderRole()) || !customer && !"WORKER".equalsIgnoreCase(m.getSenderRole())).forEach(m -> { if(customer) m.setReadByCustomer(true); else m.setReadByWorker(true); });
        messages.saveAll(rows);
        return ResponseEntity.ok(rows.stream().map(this::messageMap).toList());
    }

    @PostMapping("/bookings/{bookingId}")
    public ResponseEntity<?> sendMessage(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long bookingId, @RequestBody Map<String,String> body) {
        Long caller=tokens.userIdFromAuthorization(auth); Booking b=bookings.findById(bookingId).orElse(null);
        if(caller==null) return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        if(b==null) return ResponseEntity.status(404).body(Map.of("message","Booking not found."));
        if(!isParticipant(caller,b)) return ResponseEntity.status(403).body(Map.of("message","You cannot send messages in this conversation."));
        String content=body.getOrDefault("content", "").trim();
        if(content.isEmpty() || content.length()>2000) return ResponseEntity.badRequest().body(Map.of("message","Message must contain 1 to 2000 characters."));
        AppUser sender=users.findById(caller).orElse(null); if(sender==null) return ResponseEntity.status(401).body(Map.of("message","Please sign in again."));
        BookingMessage m=new BookingMessage(); m.setBookingId(bookingId); m.setSenderId(caller); m.setSenderRole("WORKER".equalsIgnoreCase(sender.getRole())?"WORKER":"CUSTOMER"); m.setContent(content);
        m.setReadByCustomer("CUSTOMER".equalsIgnoreCase(m.getSenderRole()) || "USER".equalsIgnoreCase(m.getSenderRole())); m.setReadByWorker("WORKER".equalsIgnoreCase(m.getSenderRole()));
        BookingMessage saved=messages.save(m);
        Long recipient="WORKER".equalsIgnoreCase(m.getSenderRole()) ? b.getUser().getId() : b.getWorkerId();
        notifications.create(recipient, "message", "New booking message", sender.getFullName()+" sent you a message about booking HS-"+bookingId+".", bookingId);
        return ResponseEntity.status(HttpStatus.CREATED).body(messageMap(saved));
    }

    // Opens or reuses one direct conversation for a customer/worker pair. No booking is required.
    @PostMapping("/direct/conversations")
    @Transactional
    public ResponseEntity<?> openDirectConversation(@RequestHeader(value="Authorization", required=false) String auth, @RequestBody Map<String,Object> body) {
        Long caller = tokens.userIdFromAuthorization(auth);
        if (caller == null) return ResponseEntity.status(401).body(Map.of("message", "Please sign in again."));
        AppUser customer = users.findById(caller).orElse(null);
        if (customer == null || !("CUSTOMER".equalsIgnoreCase(customer.getRole()) || "USER".equalsIgnoreCase(customer.getRole()))) {
            return ResponseEntity.status(403).body(Map.of("message", "Customer account required."));
        }
        Long workerId;
        try { workerId = Long.valueOf(String.valueOf(body.get("workerId"))); }
        catch (Exception ex) { return ResponseEntity.badRequest().body(Map.of("message", "A valid workerId is required.")); }
        AppUser worker = users.findById(workerId).orElse(null);
        if (worker == null || !"WORKER".equalsIgnoreCase(worker.getRole())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Selected worker account was not found."));
        }
        DirectConversation conversation = directConversations.findByCustomerIdAndWorkerId(caller, workerId).orElse(null);
        if (conversation == null) {
            conversation = new DirectConversation();
            conversation.setCustomerId(caller);
            conversation.setWorkerId(workerId);
            try {
                conversation = directConversations.saveAndFlush(conversation);
            } catch (DataIntegrityViolationException race) {
                conversation = directConversations.findByCustomerIdAndWorkerId(caller, workerId).orElseThrow(() -> race);
            }
        }
        return ResponseEntity.ok(directConversationMap(conversation, caller, true));
    }

    @GetMapping("/direct/conversations/customer/{userId}")
    public ResponseEntity<?> directCustomerConversations(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long userId) {
        Long caller = tokens.userIdFromAuthorization(auth);
        if (caller == null || !caller.equals(userId)) return ResponseEntity.status(401).body(Map.of("message", "Please sign in again."));
        AppUser customer = users.findById(caller).orElse(null);
        if (customer == null || !("CUSTOMER".equalsIgnoreCase(customer.getRole()) || "USER".equalsIgnoreCase(customer.getRole()))) return ResponseEntity.status(403).body(Map.of("message", "Customer account required."));
        return ResponseEntity.ok(directConversations.findByCustomerIdOrderByCreatedAtDesc(userId).stream().map(c -> directConversationMap(c, caller, true)).toList());
    }

    @GetMapping("/direct/conversations/worker/{workerId}")
    public ResponseEntity<?> directWorkerConversations(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long workerId) {
        Long caller = tokens.userIdFromAuthorization(auth);
        AppUser worker = caller == null ? null : users.findById(caller).orElse(null);
        if (worker == null || !caller.equals(workerId) || !"WORKER".equalsIgnoreCase(worker.getRole())) return ResponseEntity.status(401).body(Map.of("message", "Worker login required."));
        return ResponseEntity.ok(directConversations.findByWorkerIdOrderByCreatedAtDesc(workerId).stream().map(c -> directConversationMap(c, caller, false)).toList());
    }

    @GetMapping("/direct/conversations/{conversationId}")
    @Transactional
    public ResponseEntity<?> getDirectMessages(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long conversationId) {
        Long caller = tokens.userIdFromAuthorization(auth);
        if (caller == null) return ResponseEntity.status(401).body(Map.of("message", "Please sign in again."));
        DirectConversation c = directConversations.findById(conversationId).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(Map.of("message", "Conversation not found."));
        if (!isDirectParticipant(caller, c)) return ResponseEntity.status(403).body(Map.of("message", "You cannot view this conversation."));
        boolean customer = Objects.equals(caller, c.getCustomerId());
        List<DirectMessage> rows = directMessages.findByConversationIdOrderByCreatedAtAsc(conversationId);
        for (DirectMessage m : rows) {
            if (customer && "WORKER".equalsIgnoreCase(m.getSenderRole())) m.setReadByCustomer(true);
            if (!customer && !"WORKER".equalsIgnoreCase(m.getSenderRole())) m.setReadByWorker(true);
        }
        directMessages.saveAll(rows);
        return ResponseEntity.ok(rows.stream().map(this::directMessageMap).toList());
    }

    @PostMapping("/direct/conversations/{conversationId}")
    public ResponseEntity<?> sendDirectMessage(@RequestHeader(value="Authorization", required=false) String auth, @PathVariable Long conversationId, @RequestBody Map<String,String> body) {
        Long caller = tokens.userIdFromAuthorization(auth);
        if (caller == null) return ResponseEntity.status(401).body(Map.of("message", "Please sign in again."));
        DirectConversation c = directConversations.findById(conversationId).orElse(null);
        if (c == null) return ResponseEntity.status(404).body(Map.of("message", "Conversation not found."));
        if (!isDirectParticipant(caller, c)) return ResponseEntity.status(403).body(Map.of("message", "You cannot send messages in this conversation."));
        String content = body.getOrDefault("content", "").trim();
        if (content.isEmpty() || content.length() > 2000) return ResponseEntity.badRequest().body(Map.of("message", "Message must contain 1 to 2000 characters."));
        AppUser sender = users.findById(caller).orElse(null);
        if (sender == null) return ResponseEntity.status(401).body(Map.of("message", "Please sign in again."));
        boolean worker = "WORKER".equalsIgnoreCase(sender.getRole());
        DirectMessage m = new DirectMessage();
        m.setConversationId(conversationId);
        m.setSenderId(caller);
        m.setSenderRole(worker ? "WORKER" : "CUSTOMER");
        m.setContent(content);
        m.setReadByCustomer(!worker);
        m.setReadByWorker(worker);
        DirectMessage saved=directMessages.save(m);
        Long recipient=worker ? c.getCustomerId() : c.getWorkerId();
        notifications.create(recipient, "message", "New direct message", sender.getFullName()+" sent you a message.", null);
        return ResponseEntity.status(HttpStatus.CREATED).body(directMessageMap(saved));
    }

    private boolean isParticipant(Long caller, Booking b) { return Objects.equals(caller,b.getUser().getId()) || Objects.equals(caller,b.getWorkerId()); }
    private boolean isDirectParticipant(Long caller, DirectConversation c) { return Objects.equals(caller, c.getCustomerId()) || Objects.equals(caller, c.getWorkerId()); }

    private Map<String,Object> directConversationMap(DirectConversation c, Long viewerId, boolean customerView) {
        Long counterpartId = customerView ? c.getWorkerId() : c.getCustomerId();
        AppUser counterpart = users.findById(counterpartId).orElse(null);
        List<DirectMessage> all = directMessages.findByConversationIdOrderByCreatedAtAsc(c.getId());
        DirectMessage last = all.isEmpty() ? null : all.get(all.size() - 1);
        long unread = all.stream().filter(m -> customerView
                ? "WORKER".equalsIgnoreCase(m.getSenderRole()) && !m.isReadByCustomer()
                : !"WORKER".equalsIgnoreCase(m.getSenderRole()) && !m.isReadByWorker()).count();
        Map<String,Object> out = new LinkedHashMap<>();
        out.put("id", "direct-" + c.getId());
        out.put("conversationId", c.getId());
        out.put("counterpartUserId", counterpartId);
        out.put("professional_name", counterpart == null ? (customerView ? "Home professional" : "Customer") : counterpart.getFullName());
        out.put("professional_avatar", null);
        out.put("booking_reference", null);
        out.put("bookingId", null);
        out.put("service_name", "Direct message");
        out.put("category", "Direct");
        out.put("booking_status", "Direct");
        out.put("last_message", last == null ? null : last.getContent());
        out.put("last_message_at", last == null ? null : last.getCreatedAt());
        out.put("unread_count", unread);
        out.put("created_at", c.getCreatedAt());
        out.put("is_direct", true);
        return out;
    }

    private List<Map<String,Object>> conversationMaps(List<Booking> bookingRows, boolean customerView) {
        if (bookingRows.isEmpty()) return List.of();
        List<Long> bookingIds = bookingRows.stream().map(Booking::getId).toList();
        Map<Long, List<BookingMessage>> messagesByBooking = new HashMap<>();
        for (BookingMessage message : messages.findByBookingIdInOrderByCreatedAtAsc(bookingIds)) {
            messagesByBooking.computeIfAbsent(message.getBookingId(), ignored -> new ArrayList<>()).add(message);
        }
        List<Long> counterpartIds = bookingRows.stream().map(b -> customerView ? b.getWorkerId() : b.getUser().getId()).filter(Objects::nonNull).distinct().toList();
        Map<Long, AppUser> counterpartUsers = new HashMap<>();
        for (AppUser user : users.findAllById(counterpartIds)) counterpartUsers.put(user.getId(), user);
        List<Map<String,Object>> result = new ArrayList<>(bookingRows.size());
        for (Booking b : bookingRows) {
            List<BookingMessage> all = messagesByBooking.getOrDefault(b.getId(), List.of());
            BookingMessage last = all.isEmpty() ? null : all.get(all.size() - 1);
            long unread = all.stream().filter(m -> customerView
                    ? "WORKER".equalsIgnoreCase(m.getSenderRole()) && !m.isReadByCustomer()
                    : !"WORKER".equalsIgnoreCase(m.getSenderRole()) && !m.isReadByWorker()).count();
            Long counterpartId = customerView ? b.getWorkerId() : b.getUser().getId();
            AppUser counterpart = counterpartUsers.get(counterpartId);
            Map<String,Object> m = new LinkedHashMap<>();
            m.put("id", "booking-" + b.getId()); m.put("bookingId", b.getId());
            m.put("professional_name", counterpart == null ? (customerView ? "Home professional" : "Customer") : counterpart.getFullName());
            m.put("professional_avatar", null); m.put("booking_reference", "HS-" + b.getId());
            m.put("service_name", b.getService().getName()); m.put("category", b.getService().getCategory());
            m.put("booking_status", b.getStatus()); m.put("last_message", last == null ? null : last.getContent());
            m.put("last_message_at", last == null ? null : last.getCreatedAt()); m.put("unread_count", unread);
            m.put("created_at", b.getCreatedAt()); m.put("is_direct", false); result.add(m);
        }
        return result;
    }

    private Map<String,Object> messageMap(BookingMessage m) { Map<String,Object> out=new LinkedHashMap<>(); out.put("id",m.getId()); out.put("conversation_id","booking-"+m.getBookingId()); out.put("sender","WORKER".equalsIgnoreCase(m.getSenderRole())?"professional":"customer"); out.put("content",m.getContent()); out.put("read_by_customer",m.isReadByCustomer()); out.put("created_at",m.getCreatedAt()); return out; }
    private Map<String,Object> directMessageMap(DirectMessage m) { Map<String,Object> out=new LinkedHashMap<>(); out.put("id",m.getId()); out.put("conversation_id","direct-"+m.getConversationId()); out.put("sender","WORKER".equalsIgnoreCase(m.getSenderRole())?"professional":"customer"); out.put("content",m.getContent()); out.put("read_by_customer",m.isReadByCustomer()); out.put("created_at",m.getCreatedAt()); return out; }
}
