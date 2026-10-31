import { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Star,
  X,
  XCircle,
} from 'lucide-react';
import {
  type Booking,
  type BookingCategory,
  type BookingStatus,
  categories,
  formatAppointment,
  formatDate,
  formatPrice,
  paymentColors,
  statusColors,
  statusOrder,
} from '@/lib/bookings';
import { useBookings } from '@/lib/useBookings';
import './bookings.css';

type SortKey = 'newest' | 'oldest' | 'appointment';
type StatusFilter = 'All' | BookingStatus;

const statusFilters: StatusFilter[] = ['All', 'Upcoming' as BookingStatus, 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

const proAvatars: Record<string, string> = {
  'Suresh K.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpkFRZR7nxiXZyWPpU62hxmQTo_G17rdQ4mBOFo955cUzrkmIEpAHRf8DH-MVqnKDWRBYlInQq9OImLiC2EBZeh66LA_6Kbhfk8lmpKUnvpA1Q-dBpZkrfNwkYTSOZaTZv51ZuAn0v6Yf-pf1OrU1w2VYVx5Qm_UJ_3azB8d_4gUpGV2dYSzgfMc3HUC1zGDYJTN_H3g45WXdrjI-uqIZS-o0l9yovxwI2NBH3RW1zjX0x4C0Ao4kd',
  'Priya M.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4q23EEk9Olh1z00x0KksQOFxw8kSFh1Utw3P6VSk7nHnhj694OyOefLnp0hDgZagTNO9nRQGRJySWm-qkltILnoNXRtPVHLZSpyemMZo7Qzb7YGmsAeunDjRDvrscl05l79B3vvNkXzIyKH0JS2QMgFb8VG_X5L36jR_GA0jU56XEGAEmBp1NZETq2-fcyk8yISnFD24kVugfK3O4nGIdoNBlEqRh96YHUy2GqCB0lh4g4L2TXL1',
  'Ravi S.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBvL--ztysb9JCMBVzFlvtPARHt7bkt0SFyC5b6-kjP0JjuoObITx8Ja-FHZjsS_VDsL7nOy4dlWHa3-mvCBDOY4fjNw7fUnop2plcrXHJQjVKCb_fq6eTMpfSK9YINn9djvy03vse91Hc2x8Pv_Cj0DM5Vl8Ulo2nK5NzyRJSy5Hr2CZSTmY5_IGmpbZ4oJW9HGE0DH9QomXHXqJEMFT4XbBDA9OCxUa6BsVC7-q5S54T-GPSCGcP',
};

function getAvatar(b: Booking): string {
  if (b.professional_avatar) return b.professional_avatar;
  return proAvatars[b.professional_name] ?? '';
}

function isUpcoming(b: Booking): boolean {
  return ['Confirmed', 'Pending'].includes(b.booking_status) && new Date(b.appointment_at).getTime() > Date.now() - 86400000;
}

type ModalState =
  | { type: 'details'; booking: Booking }
  | { type: 'reschedule'; booking: Booking }
  | { type: 'cancel'; booking: Booking }
  | { type: 'contact'; booking: Booking }
  | { type: 'review'; booking: Booking }
  | null;

type Props = { userId: string | undefined; onExploreServices: () => void; onOpenMessages?: (conversationId: string, draft: string) => void };

export default function BookingsPage({ userId, onExploreServices, onOpenMessages }: Props) {
  const { bookings, loading, error, updateBooking } = useBookings(userId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | BookingCategory>('All');
  const [sort, setSort] = useState<SortKey>('newest');
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 2800);
  };

  const filtered = useMemo(() => {
    let list = bookings.filter((b) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || b.service_name.toLowerCase().includes(q) || b.professional_name.toLowerCase().includes(q) || b.booking_reference.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'All' || (statusFilter === 'Upcoming' as BookingStatus && isUpcoming(b)) || b.booking_status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || b.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(a.appointment_at).getTime() - new Date(b.appointment_at).getTime();
    });
    return list;
  }, [bookings, search, statusFilter, categoryFilter, sort]);

  const counts = useMemo(() => ({
    total: bookings.length,
    upcoming: bookings.filter(isUpcoming).length,
    completed: bookings.filter((b) => b.booking_status === 'Completed').length,
    cancelled: bookings.filter((b) => b.booking_status === 'Cancelled').length,
  }), [bookings]);

  const handleReschedule = async (booking: Booking, newDate: string, newTime: string) => {
    const iso = new Date(`${newDate}T${newTime}`).toISOString();
    const { error: err } = await updateBooking(booking.id, { appointment_at: iso });
    if (err) { showToast('Could not reschedule: ' + err); return; }
    showToast(`Appointment rescheduled for ${formatAppointment(iso)}.`);
    setModal(null);
  };

  const handleCancel = async (booking: Booking, reason: string) => {
    const { error: err } = await updateBooking(booking.id, { booking_status: 'Cancelled', cancellation_reason: reason });
    if (err) { showToast('Could not cancel: ' + err); return; }
    showToast('Booking cancelled successfully.');
    setModal(null);
  };

  const handleReview = async (booking: Booking, rating: number, text: string) => {
    const { error: err } = await updateBooking(booking.id, { rating, review_text: text });
    if (err) { showToast('Could not submit review: ' + err); return; }
    showToast('Thank you! Your review has been submitted.');
    setModal(null);
  };

  if (loading) {
    return <div className="bookings-loading">Loading your bookings...</div>;
  }

  return (
    <div className="bookings-page">
      <div className="bookings-header">
        <div>
          <span className="eyebrow">Appointments</span>
          <h1>My Bookings</h1>
          <p className="bookings-subtitle">Manage your home service appointments in one place.</p>
        </div>
      </div>

      {error && <div className="bookings-error">Could not load from the database: {error}. Please try again shortly.</div>}

      <div className="summary-grid">
        <SummaryCard icon={<CalendarDays size={19} />} label="Total Bookings" value={counts.total} accent="summary-total" />
        <SummaryCard icon={<Clock size={19} />} label="Upcoming" value={counts.upcoming} accent="summary-upcoming" />
        <SummaryCard icon={<CheckCircle2 size={19} />} label="Completed" value={counts.completed} accent="summary-completed" />
        <SummaryCard icon={<XCircle size={19} />} label="Cancelled" value={counts.cancelled} accent="summary-cancelled" />
      </div>

      <div className="bookings-controls">
        <label className="bookings-search">
          <Search size={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by service, professional, or booking ID" aria-label="Search bookings" />
          {search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="bookings-select" aria-label="Filter by status">
          {statusFilters.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as 'All' | BookingCategory)} className="bookings-select" aria-label="Filter by category">
          <option value="All">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="bookings-sort">
          <ArrowDownUp size={15} />
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort bookings">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="appointment">Appointment date</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bookings-empty">
          <Search size={32} />
          <h3>No bookings match your filters</h3>
          <p>Try adjusting your search or filters, or explore available services.</p>
          <button className="dark-button" onClick={onExploreServices}>Explore Services <ChevronRight size={16} /></button>
        </div>
      ) : (
        <div className="booking-cards-grid">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              upcoming={isUpcoming(b)}
              onView={() => setModal({ type: 'details', booking: b })}
              onReschedule={() => setModal({ type: 'reschedule', booking: b })}
              onCancel={() => setModal({ type: 'cancel', booking: b })}
              onContact={() => setModal({ type: 'contact', booking: b })}
              onBookAgain={() => { showToast('Starting a new booking for ' + b.service_name + '.'); onExploreServices(); }}
              onReview={() => setModal({ type: 'review', booking: b })}
              onMessage={() => onOpenMessages?.(`booking-${b.id}`, 'Hi')}
            />
          ))}
        </div>
      )}

      {modal && (
        modal.type === 'details' ? <DetailsModal booking={modal.booking} onClose={() => setModal(null)} />
        : modal.type === 'reschedule' ? <RescheduleModal booking={modal.booking} onClose={() => setModal(null)} onSubmit={handleReschedule} />
        : modal.type === 'cancel' ? <CancelModal booking={modal.booking} onClose={() => setModal(null)} onSubmit={handleCancel} />
        : modal.type === 'contact' ? <ContactModal booking={modal.booking} onClose={() => setModal(null)} onOpenMessages={onOpenMessages} />
        : modal.type === 'review' ? <ReviewModal booking={modal.booking} onClose={() => setModal(null)} onSubmit={handleReview} />
        : null
      )}

      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function SummaryCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <div className={`summary-card ${accent}`}>
      <span className="summary-icon">{icon}</span>
      <div><strong>{value}</strong><span>{label}</span></div>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`status-badge ${statusColors[status]}`}>{status}</span>;
}

function PaymentBadge({ status }: { status: Booking['payment_status'] }) {
  return <span className={`pay-badge ${paymentColors[status]}`}>{status}</span>;
}

function BookingCard({ booking, upcoming, onView, onReschedule, onCancel, onContact, onBookAgain, onReview, onMessage }: {
  booking: Booking;
  upcoming: boolean;
  onView: () => void;
  onReschedule: () => void;
  onCancel: () => void;
  onContact: () => void;
  onBookAgain: () => void;
  onReview: () => void;
  onMessage: () => void;
}) {
  const avatar = getAvatar(booking);
  const canCancel = upcoming && booking.booking_status !== 'Completed' && booking.booking_status !== 'Cancelled';
  const canReview = booking.booking_status === 'Completed' && !booking.rating;
  return (
    <article className="booking-detail-card">
      <div className="bdc-top">
        <div className="bdc-pro">
          {avatar ? <img src={avatar} alt={booking.professional_name} /> : <span className="bdc-avatar-fallback">{booking.professional_name[0]}</span>}
          <div>
            <h3>{booking.service_name}</h3>
            <p>{booking.professional_name} • {booking.category}</p>
          </div>
        </div>
        <div className="bdc-badges">
          <StatusBadge status={booking.booking_status} />
        </div>
      </div>
      <div className="bdc-meta">
        <div><CalendarClock size={15} /><span>{formatAppointment(booking.appointment_at)}</span></div>
        <div><MapPin size={15} /><span>{booking.location_address || booking.location_area || 'Address not provided'}</span></div>
        <div><span className="bdc-ref">{booking.booking_reference}</span></div>
      </div>
      {booking.customer_note && <p className="bdc-note">“{booking.customer_note}”</p>}
      <div className="bdc-footer">
        <span className="bdc-price">{formatPrice(booking.price)} <PaymentBadge status={booking.payment_status} /></span>
        <div className="bdc-actions">
          <button className="small-button" onClick={onView}>View Details</button>
          {upcoming && <button className="outline-button sm" onClick={onReschedule}>Reschedule</button>}
          {canCancel && <button className="outline-button sm danger" onClick={onCancel}>Cancel</button>}
          {booking.booking_status === 'Completed' && <button className="outline-button sm" onClick={onBookAgain}>Book Again</button>}
          {canReview && <button className="outline-button sm" onClick={onReview}>Leave Review</button>}
          <button className="outline-button sm" onClick={onMessage}><MessageSquare size={14} /> Message</button>
          <button className="icon-button sm" onClick={onContact} aria-label="Contact professional"><Phone size={16} /></button>
        </div>
      </div>
    </article>
  );
}

function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>{title}</h3><button className="modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button></div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

function DetailsModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const timeline = getTimeline(booking);
  return (
    <Modal title={`Booking ${booking.booking_reference}`} onClose={onClose} footer={<button className="dark-button" onClick={onClose}>Close</button>}>
      <div className="details-grid">
        <div className="details-pro">
          {booking.professional_avatar && <img src={booking.professional_avatar} alt={booking.professional_name} />}
          <div><strong>{booking.professional_name}</strong><span>{booking.service_name}</span></div>
        </div>
        <DetailRow label="Category" value={booking.category} />
        <DetailRow label="Appointment" value={formatAppointment(booking.appointment_at)} />
        <DetailRow label="Location" value={booking.location_address || booking.location_area || 'Address not provided'} />
        <DetailRow label="Booking created" value={formatDate(booking.created_at)} />
        <DetailRow label="Price" value={`${formatPrice(booking.price)} (${booking.payment_method ?? 'N/A'})`} />
        <div className="detail-row"><span>Status</span><StatusBadge status={booking.booking_status} /></div>
        <div className="detail-row"><span>Payment</span><PaymentBadge status={booking.payment_status} /></div>
        {booking.customer_note && <DetailRow label="Customer note" value={`“${booking.customer_note}”`} />}
        {booking.cancellation_reason && <DetailRow label="Cancellation reason" value={booking.cancellation_reason} />}
        {booking.rating && <DetailRow label="Your rating" value={`${booking.rating}/5`} />}
        {booking.review_text && <DetailRow label="Your review" value={booking.review_text} />}
      </div>
      <div className="timeline">
        <h4>Status Timeline</h4>
        {timeline.map((step, i) => (
          <div key={i} className={`timeline-step ${step.done ? 'done' : ''} ${step.cancelled ? 'cancelled' : ''}`}>
            <span className="timeline-dot" /><div><strong>{step.label}</strong>{step.date && <small>{step.date}</small>}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function getTimeline(b: Booking) {
  const steps: { label: string; done: boolean; date?: string; cancelled?: boolean }[] = [
    { label: 'Booked', done: true, date: formatDate(b.created_at) },
  ];
  const idx = statusOrder.indexOf(b.booking_status);
  if (b.booking_status === 'Cancelled') {
    steps[0].done = true;
    steps.push({ label: 'Cancelled', done: true, cancelled: true, date: formatDate(b.created_at) });
    return steps;
  }
  ['Confirmed', 'In Progress', 'Completed'].forEach((s) => {
    const stepIdx = statusOrder.indexOf(s as BookingStatus);
    steps.push({ label: s, done: idx >= stepIdx });
  });
  return steps;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div className="detail-row"><span>{label}</span><strong>{value}</strong></div>;
}

function RescheduleModal({ booking, onClose, onSubmit }: { booking: Booking; onClose: () => void; onSubmit: (b: Booking, d: string, t: string) => void }) {
  const current = new Date(booking.appointment_at);
  const localDate = (value = new Date()) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  const today = localDate();
  const [date, setDate] = useState(localDate(current) < today ? today : localDate(current));
  const [time, setTime] = useState(current.toTimeString().slice(0, 5));
  return (
    <Modal title="Reschedule Appointment" onClose={onClose} footer={<>
      <button className="outline-button" onClick={onClose}>Cancel</button>
      <button className="dark-button" onClick={() => onSubmit(booking, date, time)} disabled={!date || !time || new Date(`${date}T${time}`).getTime() <= Date.now()}>Confirm Reschedule</button>
    </>}>
      <p className="modal-intro">Choose a new date and time for {booking.service_name} with {booking.professional_name}.</p>
      <label className="modal-field">New date<input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <label className="modal-field">New time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
    </Modal>
  );
}

function CancelModal({ booking, onClose, onSubmit }: { booking: Booking; onClose: () => void; onSubmit: (b: Booking, reason: string) => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal title="Cancel Booking" onClose={onClose} footer={<>
      <button className="outline-button" onClick={onClose}>Keep Booking</button>
      <button className="dark-button danger-bg" onClick={() => reason.trim() && onSubmit(booking, reason.trim())} disabled={!reason.trim()}>Confirm Cancellation</button>
    </>}>
      <p className="modal-intro">Are you sure you want to cancel <strong>{booking.booking_reference}</strong> ({booking.service_name})? Please tell us why so we can improve.</p>
      <label className="modal-field">Cancellation reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. No longer needed, scheduling conflict..." rows={3} /></label>
    </Modal>
  );
}

function ContactModal({ booking, onClose, onOpenMessages }: { booking: Booking; onClose: () => void; onOpenMessages?: (conversationId: string, draft: string) => void }) {
  const phone = booking.professional_phone?.trim() || '';
  const email = booking.professional_email?.trim() || '';
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const subject = `HomeServe booking ${booking.booking_reference} - ${booking.service_name}`;
  const gmailUrl = email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`
    : '';

  const copyPhone = async () => {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      window.alert(`Copied professional phone number: ${phone}`);
    } catch {
      window.prompt('Copy professional phone number:', phone);
    }
  };

  const openMessages = () => {
    onClose();
    if (onOpenMessages) {
      onOpenMessages(`booking-${booking.id}`, 'Hi');
    } else {
      window.alert('Open Messages from the sidebar to continue this conversation.');
    }
  };

  return (
    <Modal title="Contact Professional" onClose={onClose} footer={<button className="dark-button" onClick={onClose}>Close</button>}>
      <div className="contact-pro">
        {booking.professional_avatar && <img src={booking.professional_avatar} alt={booking.professional_name} />}
        <div><strong>{booking.professional_name}</strong><span>{booking.service_name}</span></div>
      </div>
      <div className="contact-options">
        {phone ? (
          <a href={`tel:${cleanPhone}`} className="contact-option">
            <Phone size={18} /><div><strong>Call</strong><span>{phone}</span></div>
          </a>
        ) : (
          <button type="button" className="contact-option" disabled>
            <Phone size={18} /><div><strong>Call</strong><span>Phone number not available</span></div>
          </button>
        )}
        <button type="button" className="contact-option" onClick={openMessages}>
          <MessageSquare size={18} /><div><strong>Message</strong><span>Open HomeServe chat</span></div>
        </button>
        {email ? (
          <a href={gmailUrl} target="_blank" rel="noopener noreferrer" className="contact-option">
            <Mail size={18} /><div><strong>Email</strong><span>Compose in Gmail · {email}</span></div>
          </a>
        ) : (
          <button type="button" className="contact-option" disabled>
            <Mail size={18} /><div><strong>Email</strong><span>Email address not available</span></div>
          </button>
        )}
      </div>
    </Modal>
  );
}
function ReviewModal({ booking, onClose, onSubmit }: { booking: Booking; onClose: () => void; onSubmit: (b: Booking, rating: number, text: string) => void }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  return (
    <Modal title="Leave a Review" onClose={onClose} footer={<>
      <button className="outline-button" onClick={onClose}>Cancel</button>
      <button className="dark-button" onClick={() => onSubmit(booking, rating, text.trim())} disabled={!text.trim()}>Submit Review</button>
    </>}>
      <p className="modal-intro">How was your experience with {booking.professional_name} for {booking.service_name}?</p>
      <div className="review-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <button key={i} onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}><Star size={28} fill={i < rating ? 'currentColor' : 'none'} className={i < rating ? 'star-active' : 'star-inactive'} /></button>
        ))}
      </div>
      <label className="modal-field">Your review<textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tell others about your experience..." rows={4} /></label>
    </Modal>
  );
}
