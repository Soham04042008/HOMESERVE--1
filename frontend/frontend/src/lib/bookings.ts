export type BookingStatus = 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Pending' | 'Paid' | 'Refunded';
export type BookingCategory = 'Electrician' | 'Plumbing' | 'Cleaning' | 'Carpentry' | 'AC Repair' | 'Painting' | 'Other';

export type Booking = {
  id: string;
  booking_reference: string;
  service_name: string;
  category: BookingCategory;
  professional_name: string;
  professional_avatar: string | null;
  professional_phone: string | null;
  professional_email: string | null;
  appointment_at: string;
  location_area: string;
  location_address: string;
  price: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  booking_status: BookingStatus;
  customer_note: string | null;
  cancellation_reason: string | null;
  rating: number | null;
  review_text: string | null;
  created_at: string;
  is_demo?: boolean;
};

export const statusOrder: BookingStatus[] = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

export const statusColors: Record<BookingStatus, string> = {
  Pending: 'status-pending',
  Confirmed: 'status-confirmed',
  'In Progress': 'status-progress',
  Completed: 'status-completed',
  Cancelled: 'status-cancelled',
};

export const paymentColors: Record<PaymentStatus, string> = {
  Pending: 'pay-pending',
  Paid: 'pay-paid',
  Refunded: 'pay-refunded',
};

export const categories: BookingCategory[] = ['Electrician', 'Plumbing', 'Cleaning', 'Carpentry', 'AC Repair', 'Painting', 'Other'];

export const demoBookings: Booking[] = [
  {
    id: 'demo-1',
    booking_reference: 'HS-1001',
    service_name: 'Plumbing Inspection',
    category: 'Plumbing',
    professional_name: 'Suresh K.',
    professional_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpkFRZR7nxiXZyWPpU62hxmQTo_G17rdQ4mBOFo955cUzrkmIEpAHRf8DH-MVqnKDWRBYlInQq9OImLiC2EBZeh66LA_6Kbhfk8lmpKUnvpA1Q-dBpZkrfNwkYTSOZaTZv51ZuAn0v6Yf-pf1OrU1w2VYVx5Qm_UJ_3azB8d_4gUpGV2dYSzgfMc3HUC1zGDYJTN_H3g45WXdrjI-uqIZS-o0l9yovxwI2NBH3RW1zjX0x4C0Ao4kd',
    professional_phone: '+91 98700 12345',
    professional_email: 'suresh@example.com',
    appointment_at: getTomorrowAt(10),
    location_area: 'Panvel',
    location_address: 'Flat 402, Lake View Residency, Panvel, Navi Mumbai',
    price: 499,
    payment_status: 'Pending',
    payment_method: 'Cash',
    booking_status: 'Confirmed',
    customer_note: 'Please check the kitchen sink leakage.',
    cancellation_reason: null,
    rating: null,
    review_text: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    is_demo: true,
  },
  {
    id: 'demo-2',
    booking_reference: 'HS-1002',
    service_name: 'Deep House Cleaning',
    category: 'Cleaning',
    professional_name: 'Priya M.',
    professional_avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4q23EEk9Olh1z00x0KksQOFxw8kSFh1Utw3P6VSk7nHnhj694OyOefLnp0hDgZagTNO9nRQGRJySWm-qkltILnoNXRtPVHLZSpyemMZo7Qzb7YGmsAeunDjRDvrscl05l79B3vvNkXzIyKH0JS2QMgFb8VG_X5L36jR_GA0jU56XEGAEmBp1NZETq2-fcyk8yISnFD24kVugfK3O4nGIdoNBlEqRh96YHUy2GqCB0lh4g4L2TXL1',
    professional_phone: '+91 98200 67890',
    professional_email: 'priya@example.com',
    appointment_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    location_area: 'Panvel',
    location_address: 'Flat 402, Lake View Residency, Panvel, Navi Mumbai',
    price: 799,
    payment_status: 'Paid',
    payment_method: 'UPI',
    booking_status: 'Completed',
    customer_note: 'Deep cleaning for a 2-bedroom apartment.',
    cancellation_reason: null,
    rating: null,
    review_text: null,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
    is_demo: true,
  },
];

function getTomorrowAt(hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export function formatAppointment(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}
