import { useCallback, useEffect, useState } from 'react';
import { type Professional, type ProCategory, type Availability } from './professionals';

type ApiService = { id?: string | number; worker_service_id?: string | number; name?: string; price?: number | string };
type ApiProfessional = {
  id?: string | number;
  user_id?: string | number;
  name?: string;
  category?: string;
  specialization?: string;
  bio?: string;
  avatar?: string | null;
  rating?: number;
  reviews?: number;
  review_details?: Array<{id?: string | number; rating?: number; comment?: string; customer_name?: string; customerName?: string; service_name?: string; serviceName?: string; created_at?: string; createdAt?: string}>;
  starting_price?: number | string;
  area?: string;
  experience_years?: number | string;
  availability?: string;
  verified?: boolean;
  phone?: string | null;
  services?: ApiService[];
};

type UseProfessionalsResult = {
  professionals: Professional[];
  usingDemo: boolean;
  loading: boolean;
  error: string | null;
};

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

function mapCategory(value: string | undefined): ProCategory {
  const normalized = (value || '').trim().toLowerCase();
  if (['electrical', 'electrician'].includes(normalized)) return 'Electrician';
  if (['plumbing', 'plumber'].includes(normalized)) return 'Plumbing';
  if (['cleaning', 'cleaner'].includes(normalized)) return 'Cleaning';
  if (['carpentry', 'carpenter'].includes(normalized)) return 'Carpentry';
  if (['painting', 'painter'].includes(normalized)) return 'Painting';
  if (['ac repair', 'air conditioning'].includes(normalized)) return 'AC Repair';
  if (normalized === 'landscaping') return 'Landscaping';
  return 'Handyman';
}

function mapAvailability(value: string | undefined): Availability {
  const normalized = (value || '').toLowerCase();
  if (normalized.includes('unavailable')) return 'Unavailable';
  if (normalized.includes('busy')) return 'Busy';
  if (normalized.includes('week')) return 'Available This Week';
  return 'Available Today';
}

function mapProfessional(item: ApiProfessional): Professional {
  const services = (item.services || []).map((service) => ({
    id: service.id,
    worker_service_id: service.worker_service_id ?? service.id,
    name: service.name?.trim() || 'Home service',
    price: Number(service.price ?? item.starting_price ?? 0),
  }));
  const startingPrice = Number(item.starting_price ?? services[0]?.price ?? 0);
  return {
    id: String(item.id ?? `worker-${item.name ?? 'unknown'}`),
    user_id: item.user_id,
    name: item.name?.trim() || 'Home professional',
    category: mapCategory(item.category),
    specialization: item.specialization?.trim() || item.category || 'Home services',
    bio: item.bio || 'Home service professional.',
    avatar: item.avatar || null,
    rating: Number(item.rating ?? 0),
    reviews: Number(item.reviews ?? 0),
    review_details: (item.review_details || []).map((r) => ({ id: String(r.id ?? ''), rating: Number(r.rating ?? 0), comment: String(r.comment ?? ''), customer_name: String(r.customer_name ?? r.customerName ?? 'Customer'), service_name: String(r.service_name ?? r.serviceName ?? 'Home service'), created_at: String(r.created_at ?? r.createdAt ?? new Date().toISOString()) })),
    starting_price: Number.isFinite(startingPrice) ? startingPrice : 0,
    area: item.area || 'Location not specified',
    experience_years: Number(item.experience_years ?? 0),
    availability: mapAvailability(item.availability),
    verified: Boolean(item.verified),
    phone: item.phone || null,
    services: services.length ? services : [{ name: item.specialization || 'Home service', price: startingPrice }],
    is_demo: false,
  };
}

export function useProfessionals(): UseProfessionalsResult {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [usingDemo, setUsingDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/workers/directory`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`Worker directory API returned HTTP ${response.status}`);
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) throw new Error('Worker directory API returned an unexpected response.');
      const directoryWorkers = payload as ApiProfessional[];
      // Fetch reviews for all workers in one request instead of N requests.
      const workersNeedingReviews = directoryWorkers.filter((worker) => !Array.isArray(worker.review_details));
      const workerIds = workersNeedingReviews
        .map((worker) => worker.user_id ?? String(worker.id ?? '').replace(/^worker-/, ''))
        .filter((id) => id !== undefined && id !== null && String(id).trim() !== '')
        .map((id) => String(id));
      let reviewsByWorker: Record<string, NonNullable<ApiProfessional['review_details']>> = {};
      if (workerIds.length) {
        try {
          const params = new URLSearchParams();
          workerIds.forEach((id) => params.append('workerIds', id));
          const reviewResponse = await fetch(`${API_BASE}/api/workers/reviews/batch?${params.toString()}`, {
            headers: { Accept: 'application/json' },
          });
          if (reviewResponse.ok) {
            const payload: unknown = await reviewResponse.json();
            if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
              reviewsByWorker = payload as Record<string, NonNullable<ApiProfessional['review_details']>>;
            }
          }
        } catch {
          // Keep directory data usable if the optional review request fails.
        }
      }
      const databaseWorkers = directoryWorkers.map((worker) => {
        if (Array.isArray(worker.review_details)) return mapProfessional(worker);
        const workerId = String(worker.user_id ?? String(worker.id ?? '').replace(/^worker-/, ''));
        const rows = reviewsByWorker[workerId] || [];
        const normalized = rows.map((r) => ({
          ...r,
          customer_name: r.customer_name ?? r.customerName,
          service_name: r.service_name ?? r.serviceName,
          created_at: r.created_at ?? r.createdAt,
        }));
        const ratings = normalized.map((r) => Number(r.rating ?? 0)).filter((n) => n >= 1 && n <= 5);
        return mapProfessional({
          ...worker,
          rating: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : Number(worker.rating ?? 0),
          reviews: normalized.length || Number(worker.reviews ?? 0),
          review_details: normalized,
        });
      });
      // Show only database-backed workers in the marketplace.
      setProfessionals(databaseWorkers);
      setUsingDemo(false);
    } catch (err) {
      setProfessionals([]);
      setUsingDemo(false);
      setError(err instanceof Error ? err.message : 'Could not load professionals from the backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchProfessionals();
  }, [fetchProfessionals]);

  return { professionals, usingDemo, loading, error };
}
