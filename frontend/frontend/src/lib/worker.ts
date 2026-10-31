export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type AvailabilityStatus = 'Available' | 'Busy' | 'Unavailable';
export type PricingType = 'Fixed Price' | 'Hourly' | 'Per Visit' | 'Custom Quote';
export type QualificationType = 'Education' | 'Course' | 'Certificate' | 'Licence' | 'Experience';
export type WorkerBookingStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type WorkerTab = 'overview' | 'profile' | 'services' | 'bookings' | 'reviews' | 'portfolio' | 'messages';

export type WorkerProfile = {
  id: string;
  user_id: string;
  worker_id: string;
  full_name: string;
  headline: string;
  service_category?: string;
  bio: string;
  avatar: string | null;
  date_of_birth: string | null;
  gender: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  experience_years: number;
  preferred_areas: string[];
  languages: string[];
  verification_status: VerificationStatus;
  availability_status: AvailabilityStatus;
  min_price: number;
  max_price: number;
  starting_price: number;
  pricing_type: PricingType;
  visit_charge: number;
  negotiable: boolean;
  additional_charges: { label: string; amount: number }[];
  emergency_service: boolean;
  max_travel_distance: number;
  total_earnings: number;
  monthly_earnings: number;
  total_bookings: number;
  completed_jobs: number;
  pending_requests: number;
  average_rating: number;
  total_reviews: number;
  is_demo?: boolean;
};

export type WorkerService = {
  id: string;
  worker_id: string;
  name: string;
  category: string;
  skills: string[];
  description: string;
  experience_years: number;
  qualification: string;
  tools: string;
  service_areas: string[];
  emergency_available: boolean;
  min_price: number;
  max_price: number;
  pricing_type: PricingType;
  is_demo?: boolean;
};

export type WorkerQualification = {
  id: string;
  worker_id: string;
  type: QualificationType;
  title: string;
  institution: string;
  year: number | null;
  description: string;
  is_demo?: boolean;
};

export type WorkerAvailability = {
  id: string;
  worker_id: string;
  status: AvailabilityStatus;
  working_days: Record<string, { start: string; end: string; enabled: boolean }>;
  break_start: string;
  break_end: string;
  service_area: string;
  max_travel_distance: number;
  emergency_service: boolean;
  leave_dates: string[];
  is_demo?: boolean;
};

export type WorkerPortfolioItem = {
  id: string;
  worker_id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  completed_date: string | null;
  is_demo?: boolean;
};

export type WorkerReview = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  service_name: string;
  created_at: string;
};

export type WorkerBooking = {
  id: string;
  booking_reference: string;
  service_name: string;
  customer_name: string;
  appointment_at: string;
  location_area: string;
  price: number;
  payment_status: 'Pending' | 'Paid' | 'Refunded';
  booking_status: WorkerBookingStatus;
  customer_note: string | null;
  is_demo?: boolean;
};

export const serviceCategories = [
  'Plumbing', 'Electrical work', 'AC repair and maintenance', 'House cleaning',
  'Deep cleaning', 'Painting', 'Carpentry', 'Appliance repair', 'Pest control', 'Other home services',
];

export const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const mumbaiAreas = ['Panvel', 'Vashi', 'Nerul', 'Airoli', 'Thane', 'Kharghar', 'Kalyan', 'Dombivli'];

export const pricingTypes: PricingType[] = ['Fixed Price', 'Hourly', 'Per Visit', 'Custom Quote'];

export function generateWorkerId(): string {
  return 'HSW-' + Math.floor(10000 + Math.random() * 90000);
}

export function defaultWorkingDays(): Record<string, { start: string; end: string; enabled: boolean }> {
  const d: Record<string, { start: string; end: string; enabled: boolean }> = {};
  weekdays.forEach((day) => {
    d[day] = { start: '09:00', end: '18:00', enabled: day !== 'Sunday' };
  });
  return d;
}

export function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

export function formatPriceRange(min: number, max: number, type: PricingType): string {
  const suffix = type === 'Hourly' ? '/hr' : type === 'Per Visit' ? '/visit' : '';
  if (min === max) return `${formatPrice(min)}${suffix}`;
  return `${formatPrice(min)}–${formatPrice(max)}${suffix}`;
}

export function profileCompletion(p: WorkerProfile): number {
  const fields: (keyof WorkerProfile)[] = ['full_name', 'headline', 'bio', 'avatar', 'phone', 'email', 'city', 'state', 'pincode', 'preferred_areas', 'languages', 'starting_price'];
  let filled = 0;
  fields.forEach((f) => {
    const v = p[f];
    if (Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && v !== undefined) filled++;
  });
  return Math.round((filled / fields.length) * 100);
}

export const demoWorkerProfile: WorkerProfile = {
  id: 'demo-wp-1',
  user_id: 'demo',
  worker_id: 'HSW-10245',
  full_name: 'Ravi Sharma',
  headline: 'Master Electrician & Home Wiring Specialist',
  bio: 'Certified electrician with 7 years of residential and commercial wiring experience across Navi Mumbai. Specialised in fault diagnosis, switchboard upgrades, and emergency repairs.',
  avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBvL--ztysb9JCMBVzFlvtPARHt7bkt0SFyC5b6-kjP0JjuoObITx8Ja-FHZjsS_VDsL7nOy4dlWHa3-mvCBDOY4fjNw7fUnop2plcrXHJQjVKCb_fq6eTMpfSK9YINn9djvy03vse91Hc2x8Pv_Cj0DM5Vl8Ulo2nK5NzyRJSy5Hr2CZSTmY5_IGmpbZ4oJW9HGE0DH9QomXHXqJEMFT4XbBDA9OCxUa6BsVC7-q5S54T-GPSCGcP',
  date_of_birth: '1990-04-15',
  gender: 'Male',
  phone: '+91 98200 11223',
  email: 'ravi.sharma@homeserve.test',
  address: 'Flat 12, Green Residency',
  city: 'Panvel',
  state: 'Maharashtra',
  pincode: '410206',
  experience_years: 7,
  preferred_areas: ['Panvel', 'Vashi', 'Nerul'],
  languages: ['Hindi', 'Marathi', 'English'],
  verification_status: 'Pending',
  availability_status: 'Available',
  min_price: 399,
  max_price: 1299,
  starting_price: 399,
  pricing_type: 'Fixed Price',
  visit_charge: 0,
  negotiable: true,
  additional_charges: [{ label: 'Emergency call-out (after 8 PM)', amount: 200 }],
  emergency_service: true,
  max_travel_distance: 15,
  total_earnings: 84500,
  monthly_earnings: 18500,
  total_bookings: 124,
  completed_jobs: 118,
  pending_requests: 3,
  average_rating: 4.9,
  total_reviews: 96,
  is_demo: true,
};

export const demoWorkerServices: WorkerService[] = [
  {
    id: 'demo-ws-1',
    worker_id: 'demo-wp-1',
    name: 'Switchboard & Wiring Repair',
    category: 'Electrical work',
    skills: ['Wiring', 'Switchboard repair', 'Fault diagnosis'],
    description: 'Repair and replacement of faulty switchboards, MCBs, and residential wiring.',
    experience_years: 7,
    qualification: 'ITI Electrical',
    tools: 'Multimeter, insulation tester, wire stripper kit',
    service_areas: ['Panvel', 'Vashi'],
    emergency_available: true,
    min_price: 399,
    max_price: 899,
    pricing_type: 'Fixed Price',
    is_demo: true,
  },
  {
    id: 'demo-ws-2',
    worker_id: 'demo-wp-1',
    name: 'Full Home Wiring Inspection',
    category: 'Electrical work',
    skills: ['Safety audit', 'Load assessment'],
    description: 'Complete electrical safety inspection with detailed report.',
    experience_years: 7,
    qualification: 'ITI Electrical',
    tools: 'Multimeter, clamp meter, thermal scanner',
    service_areas: ['Panvel', 'Nerul'],
    emergency_available: false,
    min_price: 899,
    max_price: 1299,
    pricing_type: 'Per Visit',
    is_demo: true,
  },
];

export const demoWorkerQualifications: WorkerQualification[] = [
  { id: 'demo-wq-1', worker_id: 'demo-wp-1', type: 'Education', title: 'ITI in Electrical', institution: 'Mumbai ITI', year: 2017, description: '2-year industrial training in electrical maintenance.', is_demo: true },
  { id: 'demo-wq-2', worker_id: 'demo-wp-1', type: 'Certificate', title: 'Electrical Safety Certification', institution: 'Maharashtra Skill Council', year: 2018, description: 'Certified for residential and commercial electrical safety.', is_demo: true },
];

export const demoWorkerAvailability: WorkerAvailability = {
  id: 'demo-wa-1',
  worker_id: 'demo-wp-1',
  status: 'Available',
  working_days: defaultWorkingDays(),
  break_start: '13:00',
  break_end: '14:00',
  service_area: 'Panvel',
  max_travel_distance: 15,
  emergency_service: true,
  leave_dates: [],
  is_demo: true,
};

export const demoWorkerPortfolio: WorkerPortfolioItem[] = [
  { id: 'demo-wpo-1', worker_id: 'demo-wp-1', title: 'Full apartment rewiring', description: 'Complete rewiring of a 3BHK in Panvel with new MCB panel.', image_url: 'https://images.unsplash.com/photo-1621905407230-170d4f73f1bd?w=400', category: 'Electrical work', completed_date: '2026-09-10', is_demo: true },
];

export const demoWorkerReviews: WorkerReview[] = [
  { id: 'demo-wr-1', customer_name: 'Anita Desai', rating: 5, comment: 'Very professional and quick. Fixed our switchboard in under an hour.', service_name: 'Switchboard & Wiring Repair', created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 'demo-wr-2', customer_name: 'Sunil Rao', rating: 5, comment: 'Thorough safety inspection. Highly recommend for home wiring work.', service_name: 'Full Home Wiring Inspection', created_at: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'demo-wr-3', customer_name: 'Meera Joshi', rating: 4, comment: 'Good work, arrived a bit late but completed the job neatly.', service_name: 'Switchboard & Wiring Repair', created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
];

export const demoWorkerBookings: WorkerBooking[] = [
  { id: 'demo-wb-1', booking_reference: 'HS-2001', service_name: 'Switchboard Repair', customer_name: 'Karthik N.', appointment_at: new Date(Date.now() + 1 * 86400000).toISOString(), location_area: 'Panvel', price: 499, payment_status: 'Pending', booking_status: 'Pending', customer_note: 'Spark in kitchen switchboard, please check urgently.', is_demo: true },
  { id: 'demo-wb-2', booking_reference: 'HS-2002', service_name: 'Wiring Inspection', customer_name: 'Deepa M.', appointment_at: new Date(Date.now() + 2 * 86400000).toISOString(), location_area: 'Vashi', price: 899, payment_status: 'Paid', booking_status: 'Confirmed', customer_note: null, is_demo: true },
  { id: 'demo-wb-3', booking_reference: 'HS-2003', service_name: 'Emergency Fault Repair', customer_name: 'Rajesh K.', appointment_at: new Date(Date.now() - 3 * 86400000).toISOString(), location_area: 'Nerul', price: 599, payment_status: 'Paid', booking_status: 'Completed', customer_note: 'Power outage in one room.', is_demo: true },
];
