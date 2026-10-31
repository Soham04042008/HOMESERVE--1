import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import {
  demoWorkerAvailability,
  demoWorkerBookings,
  demoWorkerPortfolio,
  demoWorkerProfile,
  demoWorkerQualifications,
  demoWorkerReviews,
  demoWorkerServices,
  generateWorkerId,
  type WorkerAvailability,
  type WorkerBooking,
  type WorkerPortfolioItem,
  type WorkerProfile,
  type WorkerQualification,
  type WorkerReview,
  type WorkerService,
} from './worker';

type WorkerApiProfile = {
  id?: number | string; userId?: number | string; workerCode?: string;
  fullName?: string; email?: string; phone?: string | null; address?: string | null;
  avatarUrl?: string | null; dateOfBirth?: string | null; gender?: string | null;
  headline?: string | null; bio?: string | null; serviceCategory?: string | null;
  experienceYears?: number | null; city?: string | null; state?: string | null;
  pincode?: string | null; preferredAreasJson?: string | null; languagesJson?: string | null;
  verificationStatus?: string | null; availabilityStatus?: string | null;
  startingPrice?: number | null; minPrice?: number | null; maxPrice?: number | null;
  pricingType?: string | null; visitCharge?: number | null; negotiable?: boolean | null;
  additionalChargesJson?: string | null;
};

const WORKER_API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

function getWorkerToken(): string | null {
  try {
    const raw = window.localStorage.getItem('homeserve.auth.user');
    if (!raw) return null;
    const auth = JSON.parse(raw) as { token?: string; accessToken?: string; access_token?: string };
    return auth.token || auth.accessToken || auth.access_token || null;
  } catch { return null; }
}

function parseArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value) return fallback;
  try { const parsed: unknown = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : fallback; }
  catch { return fallback; }
}

function mapApiProfile(api: WorkerApiProfile, fallback: WorkerProfile): WorkerProfile {
  const availability = (api.availabilityStatus || 'UNAVAILABLE').toUpperCase();
  const verification = (api.verificationStatus || 'PENDING').toUpperCase();
  return {
    ...fallback,
    id: String(api.id ?? fallback.id),
    user_id: String(api.userId ?? fallback.user_id),
    worker_id: api.workerCode ?? fallback.worker_id,
    full_name: api.fullName ?? fallback.full_name,
    email: api.email ?? fallback.email,
    phone: api.phone ?? '',
    address: api.address ?? '',
    avatar: api.avatarUrl ?? null,
    date_of_birth: api.dateOfBirth ?? null,
    gender: api.gender ?? '',
    headline: api.headline ?? '',
    bio: api.bio ?? '',
    service_category: api.serviceCategory ?? '',
    experience_years: api.experienceYears ?? 0,
    city: api.city ?? '',
    state: api.state ?? '',
    pincode: api.pincode ?? '',
    preferred_areas: parseArray<string>(api.preferredAreasJson, []),
    languages: parseArray<string>(api.languagesJson, []),
    verification_status: verification === 'VERIFIED' ? 'Verified' : verification === 'REJECTED' ? 'Rejected' : 'Pending',
    availability_status: availability === 'AVAILABLE' ? 'Available' : availability === 'BUSY' ? 'Busy' : 'Unavailable',
    starting_price: api.startingPrice ?? 0,
    min_price: api.minPrice ?? 0,
    max_price: api.maxPrice ?? 0,
    pricing_type: (api.pricingType || 'Fixed Price') as WorkerProfile['pricing_type'],
    visit_charge: api.visitCharge ?? 0,
    negotiable: api.negotiable ?? false,
    additional_charges: parseArray<{ label: string; amount: number }>(api.additionalChargesJson, []),
    is_demo: false,
  };
}

type WorkerData = {
  profile: WorkerProfile;
  services: WorkerService[];
  qualifications: WorkerQualification[];
  availability: WorkerAvailability;
  portfolio: WorkerPortfolioItem[];
  reviews: WorkerReview[];
  bookings: WorkerBooking[];
  usingDemo: boolean;
  loading: boolean;
  error: string | null;
  saveProfile: (patch: Partial<WorkerProfile>) => Promise<{ error: string | null }>;
  saveAvailability: (patch: Partial<WorkerAvailability>) => Promise<{ error: string | null }>;
  addService: (s: Omit<WorkerService, 'id' | 'worker_id'>) => Promise<{ error: string | null }>;
  updateService: (id: string, patch: Partial<WorkerService>) => Promise<{ error: string | null }>;
  deleteService: (id: string) => Promise<{ error: string | null }>;
  addQualification: (q: Omit<WorkerQualification, 'id' | 'worker_id'>) => Promise<{ error: string | null }>;
  deleteQualification: (id: string) => Promise<{ error: string | null }>;
  addPortfolio: (p: Omit<WorkerPortfolioItem, 'id' | 'worker_id'>) => Promise<{ error: string | null }>;
  deletePortfolio: (id: string) => Promise<{ error: string | null }>;
  updateBookingStatus: (id: string, status: WorkerBooking['booking_status']) => Promise<{ error: string | null }>;
};

export function useWorker(userId: string | undefined, email: string | undefined, fullName: string): WorkerData {
  const [profile, setProfile] = useState<WorkerProfile>(() => ({
    ...demoWorkerProfile, id: userId ?? 'local-worker', user_id: userId ?? '', worker_id: 'NOT-ASSIGNED',
    full_name: fullName || 'Worker', email: email ?? '', headline: '', bio: '', avatar: null,
    date_of_birth: null, gender: '', phone: '', address: '', city: '', state: '', pincode: '',
    experience_years: 0, preferred_areas: [], languages: [], verification_status: 'Pending',
    availability_status: 'Unavailable', min_price: 0, max_price: 0, starting_price: 0,
    pricing_type: 'Fixed Price', visit_charge: 0, negotiable: false, additional_charges: [],
    emergency_service: false, max_travel_distance: 0, total_earnings: 0, monthly_earnings: 0,
    total_bookings: 0, completed_jobs: 0, pending_requests: 0, average_rating: 0, total_reviews: 0, is_demo: false,
  }));
  const [services, setServices] = useState<WorkerService[]>([]);
  const [qualifications, setQualifications] = useState<WorkerQualification[]>([]);
  const [availability, setAvailability] = useState<WorkerAvailability>({ ...demoWorkerAvailability, id: 'local-availability', worker_id: userId ?? '', is_demo: false, status: 'Unavailable', working_days: {}, break_start: '', break_end: '', service_area: '', max_travel_distance: 0, emergency_service: false, leave_dates: [] });
  const [portfolio, setPortfolio] = useState<WorkerPortfolioItem[]>([]);
  const [reviews, setReviews] = useState<WorkerReview[]>([]);
  const [bookings, setBookings] = useState<WorkerBooking[]>([]);
  const [usingDemo, setUsingDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = getWorkerToken();
    if (!token) {
      setError('Worker session token not found. Please sign out and sign in again.');
      setLoading(false);
      setUsingDemo(false);
      return;
    }

    try {
      const response = await fetch(`${WORKER_API_BASE}/api/workers/me`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const body = await response.json().catch(() => ({})) as WorkerApiProfile & { message?: string };
      if (!response.ok) throw new Error(body.message || `Could not load worker profile (HTTP ${response.status}).`);
      setProfile((prev) => mapApiProfile(body, {
        ...prev,
        id: userId ?? prev.id,
        user_id: userId ?? prev.user_id,
        full_name: fullName || prev.full_name || 'Worker',
        email: email || prev.email || '',
      }));
      setUsingDemo(false);

      // Load independent worker resources concurrently. Previously these requests were
      // awaited one-by-one, adding each network/database latency to the total page load.
      const userKey = String(body.userId ?? userId ?? '');
      const workerKey = String(body.id ?? userId ?? '');
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const [serviceResponse, qualificationResponse, bookingResponse, reviewResponse, supabaseAvailability, portfolioResponse] = await Promise.all([
        fetch(`${WORKER_API_BASE}/api/worker/services`, { headers }),
        fetch(`${WORKER_API_BASE}/api/workers/me/qualifications`, { headers }),
        fetch(`${WORKER_API_BASE}/api/bookings/worker/${encodeURIComponent(userKey)}`, { headers }),
        fetch(`${WORKER_API_BASE}/api/workers/me/reviews`, { headers }),
        supabase
          ? supabase.from('worker_availability').select('*').eq('worker_id', workerKey).maybeSingle()
          : Promise.resolve({ data: null }),
        fetch(`${WORKER_API_BASE}/api/workers/me/portfolio`, { headers }),
      ]);

      const [serviceBody, qualificationBody, bookingBody, reviewBody] = await Promise.all([
        serviceResponse.json().catch(() => []),
        qualificationResponse.json().catch(() => []),
        bookingResponse.json().catch(() => []),
        reviewResponse.json().catch(() => []),
      ]);
      if (!serviceResponse.ok) throw new Error(serviceBody?.message || `Could not load services (HTTP ${serviceResponse.status}).`);
      if (!qualificationResponse.ok) throw new Error(qualificationBody?.message || `Could not load qualifications (HTTP ${qualificationResponse.status}).`);
      if (!bookingResponse.ok) throw new Error(bookingBody?.message || `Could not load bookings (HTTP ${bookingResponse.status}).`);
      // Reviews are optional for loading the rest of the dashboard; an unavailable review
      // endpoint should not break worker bookings/profile.
      const reviewRows = reviewResponse.ok && Array.isArray(reviewBody) ? reviewBody as Array<{
        id?: string | number; customerName?: string; customer_name?: string; rating?: number;
        comment?: string; serviceName?: string; service_name?: string; createdAt?: string; created_at?: string;
      }> : [];
      const mappedReviews: WorkerReview[] = reviewRows.map((r) => ({
        id: String(r.id ?? ''), customer_name: String(r.customer_name ?? r.customerName ?? 'Customer'),
        rating: Number(r.rating ?? 0), comment: String(r.comment ?? ''),
        service_name: String(r.service_name ?? r.serviceName ?? 'Home service'),
        created_at: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
      }));
      setReviews(mappedReviews);
      const validRatings = mappedReviews.map((r) => r.rating).filter((n) => n >= 1 && n <= 5);
      setProfile((prev) => ({ ...prev, total_reviews: mappedReviews.length,
        average_rating: validRatings.length ? validRatings.reduce((sum, n) => sum + n, 0) / validRatings.length : 0 }));

      setServices(Array.isArray(serviceBody) ? serviceBody as WorkerService[] : []);
      const qualificationRows = Array.isArray(qualificationBody) ? qualificationBody as Array<{
        id: number | string; type: WorkerQualification['type']; title: string;
        institution?: string | null; year?: number | null; description?: string | null;
      }> : [];
      setQualifications(qualificationRows.map((q) => ({
        id: String(q.id), worker_id: workerKey, type: q.type,
        title: q.title, institution: q.institution ?? '', year: q.year ?? null,
        description: q.description ?? '', is_demo: false,
      })));

      const savedStatus = String(body.availabilityStatus || 'UNAVAILABLE').toUpperCase();
      const mappedStatus: WorkerAvailability['status'] = savedStatus === 'AVAILABLE' ? 'Available' : savedStatus === 'BUSY' ? 'Busy' : 'Unavailable';
      const aRow = supabase
        ? (supabaseAvailability as { data?: WorkerAvailability | null }).data
        : null;
      setAvailability({ ...(aRow ?? demoWorkerAvailability), id: aRow?.id ?? 'local-availability', worker_id: workerKey, status: mappedStatus, is_demo: false });

      if (portfolioResponse.ok) {
        const portfolioRows = await portfolioResponse.json().catch(() => []);
        setPortfolio(Array.isArray(portfolioRows) ? portfolioRows.map((row: any) => ({
          id: String(row.id),
          worker_id: String(row.worker_id ?? workerKey),
          title: String(row.title ?? ''),
          description: String(row.description ?? ''),
          image_url: row.image_url ?? null,
          category: String(row.category ?? ''),
          completed_date: row.completed_date ?? null,
          is_demo: false,
        })) : []);
      } else {
        const portfolioError = await portfolioResponse.json().catch(() => ({}));
        throw new Error(portfolioError?.message || `Could not load portfolio (HTTP ${portfolioResponse.status}).`);
      }

      const statusMap: Record<string, WorkerBooking['booking_status']> = {
        PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed', CANCELLED: 'Cancelled',
      };
      setBookings(Array.isArray(bookingBody) ? bookingBody.map((b: any) => ({
        id: String(b.id), booking_reference: `HS-${b.id}`, service_name: String(b.serviceName || 'Home service'),
        customer_name: String(b.customerName || 'Customer'),
        appointment_at: b.bookingDate ? new Date(`${b.bookingDate}T${b.bookingTime || '10:00'}`).toISOString() : (b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()),
        location_area: String(b.address || b.location || b.serviceArea || '').trim(), price: Number(b.price || 0), payment_status: (String(b.status || '').toUpperCase() === 'COMPLETED' || String(b.paymentStatus || '').toUpperCase() === 'PAID' ? 'Paid' : 'Pending') as WorkerBooking['payment_status'],
        booking_status: statusMap[String(b.status || 'PENDING').toUpperCase()] || 'Pending',
        customer_note: b.notes || null, is_demo: false,
      })) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load worker profile from the backend.');
      setUsingDemo(false);
    } finally {
      setLoading(false);
    }
  }, [userId, email, fullName]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  // Worker bookings are independently refreshed so new customer requests and
  // customer-side status changes appear without reloading the whole dashboard.
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refreshBookings = async () => {
      if (!active || inFlight || document.visibilityState !== 'visible') return;
      const token = getWorkerToken();
      if (!token) return;
      inFlight = true;
      try {
        const response = await fetch(`${WORKER_API_BASE}/api/bookings/worker/${encodeURIComponent(String(userId ?? ''))}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!response.ok) return;
        const rows = await response.json().catch(() => []);
        if (!active || !Array.isArray(rows)) return;
        const statusMap: Record<string, WorkerBooking['booking_status']> = {
          PENDING: 'Pending', CONFIRMED: 'Confirmed', IN_PROGRESS: 'In Progress',
          COMPLETED: 'Completed', CANCELLED: 'Cancelled',
        };
        setBookings(rows.map((b: any) => ({
          id: String(b.id), booking_reference: `HS-${b.id}`, service_name: String(b.serviceName || 'Home service'),
          customer_name: String(b.customerName || 'Customer'),
          appointment_at: b.bookingDate ? new Date(`${b.bookingDate}T${b.bookingTime || '10:00'}`).toISOString() : (b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()),
          location_area: String(b.address || b.location || b.serviceArea || '').trim(), price: Number(b.price || 0),
          payment_status: (String(b.status || '').toUpperCase() === 'COMPLETED' || String(b.paymentStatus || '').toUpperCase() === 'PAID' ? 'Paid' : 'Pending') as WorkerBooking['payment_status'],
          booking_status: statusMap[String(b.status || 'PENDING').toUpperCase()] || 'Pending',
          customer_note: b.notes || null, is_demo: false,
        })));
      } catch { /* Keep the last successful bookings during a temporary network issue. */ }
      finally { inFlight = false; }
    };
    const timer = window.setInterval(() => { void refreshBookings(); }, 4000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshBookings(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [userId]);

  // Keep worker-facing review totals and review cards current without reloading
  // the full profile/services/portfolio bundle every few seconds.
  useEffect(() => {
    let active = true;
    let inFlight = false;
    const refreshReviews = async () => {
      if (!active || inFlight || document.visibilityState !== 'visible') return;
      const token = getWorkerToken();
      if (!token) return;
      inFlight = true;
      try {
        const response = await fetch(`${WORKER_API_BASE}/api/workers/me/reviews`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!response.ok) return;
        const rows = await response.json().catch(() => []);
        if (!active || !Array.isArray(rows)) return;
        const mapped: WorkerReview[] = rows.map((r: any) => ({
          id: String(r.id ?? ''), customer_name: String(r.customer_name ?? r.customerName ?? 'Customer'),
          rating: Number(r.rating ?? 0), comment: String(r.comment ?? ''),
          service_name: String(r.service_name ?? r.serviceName ?? 'Home service'),
          created_at: String(r.created_at ?? r.createdAt ?? new Date().toISOString()),
        }));
        setReviews(mapped);
        const ratings = mapped.map((r) => r.rating).filter((n) => n >= 1 && n <= 5);
        setProfile((prev) => ({ ...prev, total_reviews: mapped.length,
          average_rating: ratings.length ? ratings.reduce((sum, n) => sum + n, 0) / ratings.length : 0 }));
      } catch { /* Keep last successful reviews when background polling fails. */ }
      finally { inFlight = false; }
    };
    const timer = window.setInterval(() => { void refreshReviews(); }, 4000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refreshReviews(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);


  const saveProfile = useCallback(async (patch: Partial<WorkerProfile>): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign out and sign in again.' };
    const payload: Record<string, unknown> = {
      fullName: patch.full_name,
      email: patch.email,
      phone: patch.phone,
      address: patch.address,
      avatarUrl: patch.avatar,
      dateOfBirth: patch.date_of_birth === undefined ? undefined : (patch.date_of_birth ?? ''),
      gender: patch.gender,
      headline: patch.headline,
      bio: patch.bio,
      serviceCategory: patch.service_category,
      experienceYears: patch.experience_years,
      city: patch.city,
      state: patch.state,
      pincode: patch.pincode,
      preferredAreasJson: patch.preferred_areas === undefined ? undefined : JSON.stringify(patch.preferred_areas),
      languagesJson: patch.languages === undefined ? undefined : JSON.stringify(patch.languages),
      availabilityStatus: patch.availability_status?.toUpperCase(),
      startingPrice: patch.starting_price,
      minPrice: patch.min_price,
      maxPrice: patch.max_price,
      pricingType: patch.pricing_type,
      visitCharge: patch.visit_charge,
      negotiable: patch.negotiable,
      additionalChargesJson: patch.additional_charges === undefined ? undefined : JSON.stringify(patch.additional_charges),
    };
    Object.keys(payload).forEach((key) => { if (payload[key] === undefined) delete payload[key]; });

    try {
      const response = await fetch(`${WORKER_API_BASE}/api/workers/me`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as WorkerApiProfile & { message?: string };
      if (!response.ok) return { error: body.message || `Profile save failed (HTTP ${response.status}).` };
      setProfile((prev) => mapApiProfile(body, { ...prev, ...patch, is_demo: false }));
      setError(null);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, []);

  const saveAvailability = useCallback(async (patch: Partial<WorkerAvailability>): Promise<{ error: string | null }> => {
    // The status badge and status buttons use the Spring Boot/MySQL worker profile as source of truth.
    if (patch.status) {
      const statusToApi = patch.status === 'Available' ? 'AVAILABLE' : patch.status === 'Busy' ? 'BUSY' : 'UNAVAILABLE';
      const result = await saveProfile({ availability_status: statusToApi === 'AVAILABLE' ? 'Available' : statusToApi === 'BUSY' ? 'Busy' : 'Unavailable' });
      if (result.error) return result;
      setAvailability((prev) => ({ ...prev, ...patch, status: patch.status!, is_demo: false }));
      return { error: null };
    }
    setAvailability((prev) => ({ ...prev, ...patch }));
    return { error: null };
  }, [saveProfile]);

  const addService = useCallback(async (s: Omit<WorkerService, 'id' | 'worker_id'>): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign out and sign in again.' };

    const payload = {
      name: s.name,
      category: s.category,
      skills: s.skills ?? [],
      description: s.description ?? '',
      experienceYears: Number(s.experience_years ?? 0),
      qualification: s.qualification ?? '',
      tools: s.tools ?? '',
      serviceAreas: s.service_areas ?? [],
      emergencyAvailable: Boolean(s.emergency_available),
      minPrice: Number(s.min_price ?? 0),
      maxPrice: Number(s.max_price ?? 0),
      pricingType: s.pricing_type || 'Fixed Price',
    };

    try {
      const response = await fetch(`${WORKER_API_BASE}/api/worker/services`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as WorkerService & { message?: string };
      if (!response.ok) return { error: body.message || `Could not add service (HTTP ${response.status}).` };
      setServices((prev) => [body, ...prev]);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, []);

  const updateService = useCallback(async (id: string, patch: Partial<WorkerService>): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign out and sign in again.' };
    const current = services.find((item) => item.id === id);
    if (!current) return { error: 'Service not found. Refresh the page and try again.' };
    const merged = { ...current, ...patch };
    const payload = {
      name: merged.name,
      category: merged.category,
      skills: merged.skills ?? [],
      description: merged.description ?? '',
      experienceYears: Number(merged.experience_years ?? 0),
      qualification: merged.qualification ?? '',
      tools: merged.tools ?? '',
      serviceAreas: merged.service_areas ?? [],
      emergencyAvailable: Boolean(merged.emergency_available),
      minPrice: Number(merged.min_price ?? 0),
      maxPrice: Number(merged.max_price ?? 0),
      pricingType: merged.pricing_type || 'Fixed Price',
    };

    try {
      const response = await fetch(`${WORKER_API_BASE}/api/worker/services/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as WorkerService & { message?: string };
      if (!response.ok) return { error: body.message || `Could not update service (HTTP ${response.status}).` };
      setServices((prev) => prev.map((item) => item.id === id ? body : item));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, [services]);

  const deleteService = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign out and sign in again.' };
    try {
      const response = await fetch(`${WORKER_API_BASE}/api/worker/services/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        return { error: body.message || `Could not delete service (HTTP ${response.status}).` };
      }
      setServices((prev) => prev.filter((item) => item.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, []);

  const addQualification = useCallback(async (q: Omit<WorkerQualification, 'id' | 'worker_id'>): Promise<{ error: string | null }> => {
    // Keep local-only behavior for an explicitly selected demo profile only.
    if (profile.is_demo) {
      const nq: WorkerQualification = { ...q, id: 'local-' + Date.now(), worker_id: profile.id, is_demo: true };
      setQualifications((prev) => [...prev, nq]);
      return { error: null };
    }
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign out and sign in again.' };
    try {
      const response = await fetch(`${WORKER_API_BASE}/api/workers/me/qualifications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: q.type, title: q.title, institution: q.institution || null, year: q.year, description: q.description || null }),
      });
      const body = await response.json().catch(() => ({})) as {
        id?: number | string; type?: WorkerQualification['type']; title?: string;
        institution?: string | null; year?: number | null; description?: string | null; message?: string;
      };
      if (!response.ok) return { error: body.message || `Could not save qualification (HTTP ${response.status}).` };
      if (body.id == null) return { error: 'The server saved no qualification ID. Please reload and check the qualification list.' };
      const saved: WorkerQualification = {
        id: String(body.id), worker_id: profile.id, type: body.type ?? q.type,
        title: body.title ?? q.title, institution: body.institution ?? q.institution ?? '',
        year: body.year ?? q.year ?? null, description: body.description ?? q.description ?? '', is_demo: false,
      };
      setQualifications((prev) => [...prev, saved]);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, [profile]);

  const deleteQualification = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const q = qualifications.find((x) => x.id === id);
    if (q?.is_demo || profile.is_demo) {
      setQualifications((prev) => prev.filter((x) => x.id !== id));
      return { error: null };
    }
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign out and sign in again.' };
    try {
      const response = await fetch(`${WORKER_API_BASE}/api/workers/me/qualifications/${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string };
        return { error: body.message || `Could not delete qualification (HTTP ${response.status}).` };
      }
      setQualifications((prev) => prev.filter((x) => x.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, [qualifications, profile]);

  const addPortfolio = useCallback(async (p: Omit<WorkerPortfolioItem, 'id' | 'worker_id'>): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token || profile.is_demo) return { error: 'Your worker session is unavailable. Please sign out and sign in again.' };
    try {
      const response = await fetch(`${WORKER_API_BASE}/api/workers/me/portfolio`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(p),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return { error: body.message || `Could not save portfolio item (HTTP ${response.status}).` };
      const saved: WorkerPortfolioItem = {
        id: String(body.id), worker_id: String(body.worker_id ?? profile.id),
        title: String(body.title ?? p.title), description: String(body.description ?? p.description),
        image_url: body.image_url ?? p.image_url, category: String(body.category ?? p.category),
        completed_date: body.completed_date ?? p.completed_date, is_demo: false,
      };
      setPortfolio((prev) => [saved, ...prev]);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, [profile]);

  const deletePortfolio = useCallback(async (id: string): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token || profile.is_demo) return { error: 'Your worker session is unavailable. Please sign out and sign in again.' };
    try {
      const response = await fetch(`${WORKER_API_BASE}/api/workers/me/portfolio/${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        return { error: body.message || `Could not delete portfolio item (HTTP ${response.status}).` };
      }
      setPortfolio((prev) => prev.filter((x) => x.id !== id));
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Could not connect to the HomeServe backend.' };
    }
  }, [profile]);

  const updateBookingStatus = useCallback(async (id: string, status: WorkerBooking['booking_status']): Promise<{ error: string | null }> => {
    const token = getWorkerToken();
    if (!token) return { error: 'Worker session token not found. Please sign in again.' };
    const statusMap: Record<WorkerBooking['booking_status'], string> = {
      Pending: 'PENDING', Confirmed: 'CONFIRMED', 'In Progress': 'IN_PROGRESS',
      Completed: 'COMPLETED', Cancelled: 'CANCELLED',
    };
    try {
      const response = await fetch(`${WORKER_API_BASE}/api/bookings/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, Accept: 'application/json' },
        body: JSON.stringify({ status: statusMap[status] }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) return { error: body?.message || `Could not update booking (HTTP ${response.status}).` };
      setBookings((prev) => prev.map((x) => (x.id === id ? { ...x, booking_status: status } : x)));
      return { error: null };
    } catch { return { error: 'Could not connect to HomeServe backend.' }; }
  }, []);

  return {
    profile, services, qualifications, availability, portfolio, reviews, bookings,
    usingDemo, loading, error,
    saveProfile, saveAvailability, addService, updateService, deleteService,
    addQualification, deleteQualification, addPortfolio, deletePortfolio, updateBookingStatus,
  };
}
