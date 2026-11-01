import { useCallback, useEffect, useState } from 'react';
import type { Booking, BookingStatus, BookingCategory } from './bookings';

type UseBookingsResult = {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  usingDemo: boolean;
  refresh: () => Promise<void>;
  updateBooking: (id: string, patch: Partial<Booking>) => Promise<{ error: string | null }>;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const auth = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('homeserve.auth.user') || 'null');
    return { token: typeof saved?.token === 'string' ? saved.token : '', id: saved?.id };
  } catch { return { token: '', id: undefined }; }
};

function mapBooking(raw: any): Booking {
  const statusMap: Record<string, BookingStatus> = {
    PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed', CANCELLED: 'Cancelled',
  };
  const date = String(raw.bookingDate || '');
  const time = String(raw.bookingTime || '10:00');
  const appointment = date ? new Date(`${date}T${time}`).toISOString() : new Date().toISOString();
  const category = String(raw.category || 'Other');
  const allowed = ['Electrician','Plumbing','Cleaning','Carpentry','AC Repair','Painting','Other'];
  return {
    id: String(raw.id),
    booking_reference: `HS-${raw.id}`,
    service_name: String(raw.serviceName || 'Home service'),
    category: (allowed.includes(category) ? category : 'Other') as BookingCategory,
    professional_name: String(raw.workerName || 'Home professional'),
    professional_avatar: null,
    professional_phone: raw.workerPhone == null ? null : String(raw.workerPhone),
    professional_email: raw.workerEmail == null ? null : String(raw.workerEmail),
    appointment_at: appointment,
    location_area: '',
    location_address: String(raw.address || ''),
    price: Number(raw.price || 0),
    payment_status: (String(raw.status || '').toUpperCase() === 'COMPLETED' || String(raw.paymentStatus || '').toUpperCase() === 'PAID') ? 'Paid' : 'Pending',
    payment_method: null,
    booking_status: statusMap[String(raw.status || 'PENDING').toUpperCase()] || 'Pending',
    customer_note: raw.notes || null,
    cancellation_reason: null,
    rating: raw.rating == null ? null : Number(raw.rating),
    review_text: raw.reviewText ?? raw.review_text ?? null,
    created_at: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    is_demo: false,
  };
}

export function useBookings(userId: string | undefined): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!userId) {
      setBookings([]); setError('Please sign in to view bookings.'); setLoading(false); return;
    }
    const session = auth();
    if (!session.token) {
      setBookings([]); setError('Login session missing. Please sign in again.'); setLoading(false); return;
    }
    if (!silent) { setLoading(true); setError(null); }
    try {
      const response = await fetch(`${API_BASE}/api/bookings/user/${encodeURIComponent(String(userId))}`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${session.token}` },
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) throw new Error(payload?.message || `Bookings API returned HTTP ${response.status}`);
      if (!Array.isArray(payload)) throw new Error('Unexpected bookings response from backend.');
      setBookings(payload.map(mapBooking));
    } catch (err) {
      if (!silent) { setBookings([]); setError(err instanceof Error ? err.message : 'Could not load bookings from HomeServe backend.'); }
    } finally { if (!silent) setLoading(false); }
  }, [userId]);

  useEffect(() => {
    void fetchBookings();
    let inFlight = false;
    const refresh = () => {
      if (document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      void fetchBookings(true).finally(() => { inFlight = false; });
    };
    const timer = window.setInterval(refresh, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchBookings]);

  const updateBooking = useCallback(async (id: string, patch: Partial<Booking>): Promise<{ error: string | null }> => {
    if (patch.appointment_at !== undefined) {
      const session = auth();
      if (!session.token) return { error: 'Login session missing. Please sign in again.' };
      const selected = new Date(patch.appointment_at);
      if (Number.isNaN(selected.getTime())) return { error: 'Choose a valid date and time.' };
      const bookingDate = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
      const bookingTime = `${String(selected.getHours()).padStart(2, '0')}:${String(selected.getMinutes()).padStart(2, '0')}:00`;
      try {
        const response = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(id)}/reschedule`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ bookingDate, bookingTime }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return { error: payload?.message || `Could not reschedule (HTTP ${response.status}).` };
        await fetchBookings();
        return { error: null };
      } catch { return { error: 'Could not connect to HomeServe backend.' }; }
    }
    if (patch.rating !== undefined || patch.review_text !== undefined) {
      const session = auth();
      if (!session.token) return { error: 'Login session missing. Please sign in again.' };
      const rating = Number(patch.rating);
      const comment = String(patch.review_text ?? '').trim();
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Choose a rating from 1 to 5 stars.' };
      if (!comment) return { error: 'Please write a review before submitting.' };
      try {
        const response = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(id)}/review`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ rating, comment }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return { error: payload?.message || `Could not submit review (HTTP ${response.status}).` };
        await fetchBookings();
        return { error: null };
      } catch { return { error: 'Could not connect to HomeServe backend.' }; }
    }
    if (patch.booking_status) {
      const session = auth();
      if (!session.token) return { error: 'Login session missing. Please sign in again.' };
      const statusMap: Record<BookingStatus, string> = {
        Pending: 'PENDING', Confirmed: 'CONFIRMED', 'In Progress': 'IN_PROGRESS',
        Completed: 'COMPLETED', Cancelled: 'CANCELLED',
      };
      try {
        const response = await fetch(`${API_BASE}/api/bookings/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${session.token}` },
          body: JSON.stringify({ status: statusMap[patch.booking_status] }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) return { error: payload?.message || `Could not update booking (HTTP ${response.status}).` };
        await fetchBookings();
        return { error: null };
      } catch { return { error: 'Could not connect to HomeServe backend.' }; }
    }
    return { error: 'This action is not supported by the current backend booking API yet.' };
  }, [fetchBookings]);

  return { bookings, loading, error, usingDemo: false, refresh: fetchBookings, updateBooking };
}
