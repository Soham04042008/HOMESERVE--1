export type ProCategory = 'Electrician' | 'Plumbing' | 'Cleaning' | 'Carpentry' | 'AC Repair' | 'Painting' | 'Handyman' | 'Landscaping';
export type Availability = 'Available Today' | 'Available This Week' | 'Busy' | 'Unavailable';

export type ProService = { id?: string | number; worker_service_id?: string | number; name: string; price: number };

export type ProfessionalReview = { id: string; rating: number; comment: string; customer_name: string; service_name: string; created_at: string };

export type Professional = {
  id: string;
  user_id?: string | number;
  name: string;
  category: ProCategory;
  specialization: string;
  bio: string;
  avatar: string | null;
  rating: number;
  reviews: number;
  review_details?: ProfessionalReview[];
  starting_price: number;
  area: string;
  experience_years: number;
  availability: Availability;
  verified: boolean;
  phone: string | null;
  services: ProService[];
  is_demo?: boolean;
};

export const proCategories: ProCategory[] = ['Electrician', 'Plumbing', 'Cleaning', 'Carpentry', 'AC Repair', 'Painting', 'Handyman', 'Landscaping'];

export const proLocations = ['Panvel', 'Vashi', 'Nerul', 'Airoli', 'Thane', 'Kharghar', 'Kalyan', 'Dombivli'];

export const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'];

const proAvatars: Record<string, string> = {
  'Ravi S.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBvL--ztysb9JCMBVzFlvtPARHt7bkt0SFyC5b6-kjP0JjuoObITx8Ja-FHZjsS_VDsL7nOy4dlWHa3-mvCBDOY4fjNw7fUnop2plcrXHJQjVKCb_fq6eTMpfSK9YINn9djvy03vse91Hc2x8Pv_Cj0DM5Vl8Ulo2nK5NzyRJSy5Hr2CZSTmY5_IGmpbZ4oJW9HGE0DH9QomXHXqJEMFT4XbBDA9OCxUa6BsVC7-q5S54T-GPSCGcP',
  'Priya M.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4q23EEk9Olh1z00x0KksQOFxw8kSFh1Utw3P6VSk7nHnhj694OyOefLnp0hDgZagTNO9nRQGRJySWm-qkltILnoNXRtPVHLZSpyemMZo7Qzb7YGmsAeunDjRDvrscl05l79B3vvNkXzIyKH0JS2QMgFb8VG_X5L36jR_GA0jU56XEGAEmBp1NZETq2-fcyk8yISnFD24kVugfK3O4nGIdoNBlEqRh96YHUy2GqCB0lh4g4L2TXL1',
  'Imran K.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpkFRZR7nxiXZyWPpU62hxmQTo_G17rdQ4mBOFo955cUzrkmIEpAHRf8DH-MVqnKDWRBYlInQq9OImLiC2EBZeh66LA_6Kbhfk8lmpKUnvpA1Q-dBpZkrfNwkYTSOZaTZv51ZuAn0v6Yf-pf1OrU1w2VYVx5Qm_UJ_3azB8d_4gUpGV2dYSzgfMc3HUC1zGDYJTN_H3g45WXdrjI-uqIZS-o0l9yovxwI2NBH3RW1zjX0x4C0Ao4kd',
};

export const demoProfessionals: Professional[] = [
  {
    id: 'demo-pro-1',
    name: 'Ravi S.',
    category: 'Electrician',
    specialization: 'Home electrical repairs',
    bio: 'Certified electrician with 7 years of experience handling residential wiring, switchboard repairs, and emergency electrical faults across Navi Mumbai.',
    avatar: proAvatars['Ravi S.'],
    rating: 4.9,
    reviews: 124,
    starting_price: 399,
    area: 'Panvel',
    experience_years: 7,
    availability: 'Available Today',
    verified: true,
    phone: '+91 98200 11223',
    services: [
      { name: 'Switchboard repair', price: 399 },
      { name: 'Full home wiring inspection', price: 899 },
      { name: 'Emergency electrical fault', price: 599 },
    ],
    is_demo: true,
  },
  {
    id: 'demo-pro-2',
    name: 'Priya M.',
    category: 'Painting',
    specialization: 'Interior painting',
    bio: 'Professional painter specialising in interior walls, texture finishes, and waterproof exterior coatings. Known for clean, on-time delivery.',
    avatar: proAvatars['Priya M.'],
    rating: 5.0,
    reviews: 86,
    starting_price: 449,
    area: 'Vashi',
    experience_years: 5,
    availability: 'Available This Week',
    verified: true,
    phone: '+91 98200 44556',
    services: [
      { name: 'Interior wall painting (per room)', price: 449 },
      { name: 'Texture finish', price: 799 },
      { name: 'Exterior waterproof coating', price: 1299 },
    ],
    is_demo: true,
  },
  {
    id: 'demo-pro-3',
    name: 'Imran K.',
    category: 'AC Repair',
    specialization: 'AC servicing and repair',
    bio: 'AC service specialist with 6 years servicing split and window units. Covers gas refilling, deep cleaning, and cooling diagnostics.',
    avatar: proAvatars['Imran K.'],
    rating: 4.8,
    reviews: 97,
    starting_price: 599,
    area: 'Nerul',
    experience_years: 6,
    availability: 'Available Today',
    verified: true,
    phone: '+91 98200 77889',
    services: [
      { name: 'AC servicing', price: 599 },
      { name: 'Gas refill', price: 999 },
      { name: 'Deep AC cleaning', price: 799 },
    ],
    is_demo: true,
  },
  {
    id: 'demo-pro-4',
    name: 'Suresh K.',
    category: 'Plumbing',
    specialization: 'Leak repairs and plumbing inspections',
    bio: 'Master plumber with 8 years fixing leaks, blockages, and fitting new bathroom fixtures. Reliable and tidy work across Panvel.',
    avatar: proAvatars['Imran K.'],
    rating: 4.7,
    reviews: 75,
    starting_price: 499,
    area: 'Panvel',
    experience_years: 8,
    availability: 'Available This Week',
    verified: false,
    phone: '+91 98700 12345',
    services: [
      { name: 'Plumbing inspection', price: 499 },
      { name: 'Leak repair', price: 699 },
      { name: 'Bathroom fitting installation', price: 999 },
    ],
    is_demo: true,
  },
  {
    id: 'demo-pro-5',
    name: 'Anita P.',
    category: 'Cleaning',
    specialization: 'Deep home cleaning',
    bio: 'Thorough home cleaning professional with 4 years of experience in deep cleaning, kitchen degreasing, and bathroom sanitisation.',
    avatar: proAvatars['Priya M.'],
    rating: 4.8,
    reviews: 63,
    starting_price: 799,
    area: 'Thane',
    experience_years: 4,
    availability: 'Available This Week',
    verified: true,
    phone: '+91 98200 33441',
    services: [
      { name: 'Deep home cleaning (2BHK)', price: 799 },
      { name: 'Kitchen degreasing', price: 599 },
      { name: 'Bathroom sanitisation', price: 399 },
    ],
    is_demo: true,
  },
  {
    id: 'demo-pro-6',
    name: 'Mahesh R.',
    category: 'Carpentry',
    specialization: 'Furniture assembly and wood repairs',
    bio: 'Skilled carpenter with 6 years in furniture assembly, door repairs, and custom woodwork. Attention to detail and clean finishes.',
    avatar: proAvatars['Ravi S.'],
    rating: 4.6,
    reviews: 51,
    starting_price: 349,
    area: 'Kharghar',
    experience_years: 6,
    availability: 'Busy',
    verified: false,
    phone: '+91 98200 55667',
    services: [
      { name: 'Furniture assembly', price: 349 },
      { name: 'Door repair', price: 449 },
      { name: 'Custom woodwork (per hour)', price: 599 },
    ],
    is_demo: true,
  },
];

export function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}
