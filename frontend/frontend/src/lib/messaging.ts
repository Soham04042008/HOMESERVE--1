export type MessageSender = 'customer' | 'professional';

export type Message = {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  content: string;
  read_by_customer: boolean;
  created_at: string;
};

export type Conversation = {
  id: string;
  professional_name: string;
  professional_avatar: string | null;
  booking_reference: string | null;
  service_name: string;
  category: string;
  booking_status: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  is_demo?: boolean;
};

const proAvatars: Record<string, string> = {
  'Suresh K.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuBpkFRZR7nxiXZyWPpU62hxmQTo_G17rdQ4mBOFo955cUzrkmIEpAHRf8DH-MVqnKDWRBYlInQq9OImLiC2EBZeh66LA_6Kbhfk8lmpKUnvpA1Q-dBpZkrfNwkYTSOZaTZv51ZuAn0v6Yf-pf1OrU1w2VYVx5Qm_UJ_3azB8d_4gUpGV2dYSzgfMc3HUC1zGDYJTN_H3g45WXdrjI-uqIZS-o0l9yovxwI2NBH3RW1zjX0x4C0Ao4kd',
  'Priya M.': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDG4q23EEk9Olh1z00x0KksQOFxw8kSFh1Utw3P6VSk7nHnhj694OyOefLnp0hDgZagTNO9nRQGRJySWm-qkltILnoNXRtPVHLZSpyemMZo7Qzb7YGmsAeunDjRDvrscl05l79B3vvNkXzIyKH0JS2QMgFb8VG_X5L36jR_GA0jU56XEGAEmBp1NZETq2-fcyk8yISnFD24kVugfK3O4nGIdoNBlEqRh96YHUy2GqCB0lh4g4L2TXL1',
};

function avatarFor(name: string): string {
  return proAvatars[name] ?? '';
}

function timeAgo(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export const demoConversations: Conversation[] = [
  {
    id: 'demo-conv-1',
    professional_name: 'Suresh K.',
    professional_avatar: avatarFor('Suresh K.'),
    booking_reference: 'HS-1001',
    service_name: 'Plumbing Inspection',
    category: 'Plumbing',
    booking_status: 'Confirmed',
    last_message: "I'll arrive tomorrow at 10:00 AM. Please keep the kitchen sink area accessible.",
    last_message_at: timeAgo(-30 * 60 * 1000),
    unread_count: 1,
    created_at: timeAgo(-3 * 86400000),
    is_demo: true,
  },
  {
    id: 'demo-conv-2',
    professional_name: 'Priya M.',
    professional_avatar: avatarFor('Priya M.'),
    booking_reference: 'HS-1002',
    service_name: 'Deep House Cleaning',
    category: 'Cleaning',
    booking_status: 'Completed',
    last_message: 'Thank you for booking! Do you have any special cleaning instructions?',
    last_message_at: timeAgo(-26 * 60 * 60 * 1000),
    unread_count: 0,
    created_at: timeAgo(-8 * 86400000),
    is_demo: true,
  },
];

export const demoMessages: Record<string, Message[]> = {
  'demo-conv-1': [
    { id: 'm1', conversation_id: 'demo-conv-1', sender: 'customer', content: 'Hi, I booked a plumbing inspection.', read_by_customer: true, created_at: timeAgo(-3 * 86400000 + 1000) },
    { id: 'm2', conversation_id: 'demo-conv-1', sender: 'professional', content: 'Hello! Thank you for booking HomeServe.', read_by_customer: true, created_at: timeAgo(-3 * 86400000 + 120000) },
    { id: 'm3', conversation_id: 'demo-conv-1', sender: 'customer', content: 'Please check the kitchen sink leakage.', read_by_customer: true, created_at: timeAgo(-3 * 86400000 + 240000) },
    { id: 'm4', conversation_id: 'demo-conv-1', sender: 'professional', content: "I'll arrive tomorrow at 10:00 AM. Please keep the kitchen sink area accessible.", read_by_customer: false, created_at: timeAgo(-30 * 60 * 1000) },
  ],
  'demo-conv-2': [
    { id: 'm5', conversation_id: 'demo-conv-2', sender: 'professional', content: 'Thank you for booking! Do you have any special cleaning instructions?', read_by_customer: true, created_at: timeAgo(-26 * 60 * 60 * 1000) },
    { id: 'm6', conversation_id: 'demo-conv-2', sender: 'customer', content: 'Please focus on the kitchen and bathrooms.', read_by_customer: true, created_at: timeAgo(-26 * 60 * 60 * 1000 + 180000) },
    { id: 'm7', conversation_id: 'demo-conv-2', sender: 'professional', content: "Sure, I'll make sure those areas receive extra attention.", read_by_customer: true, created_at: timeAgo(-26 * 60 * 60 * 1000 + 300000) },
  ],
};

export function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (sameDay) return time;
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}
