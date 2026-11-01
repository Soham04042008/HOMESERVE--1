import { useCallback, useEffect, useState } from 'react';
import type { Conversation, Message } from './messaging';

type UseMessagingResult = {
  conversations: Conversation[];
  usingDemo: boolean;
  loading: boolean;
  error: string | null;
  getMessages: (conversationId: string) => Promise<Message[]>;
  sendMessage: (conversationId: string, content: string) => Promise<{ error: string | null }>;
  markRead: (conversationId: string) => Promise<void>;
};
const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
function auth() {
  try {
    const a = JSON.parse(localStorage.getItem('homeserve.auth.user') || 'null');
    return { token: a?.token || a?.accessToken || a?.access_token || '', id: a?.id };
  } catch { return { token: '', id: undefined }; }
}
function conversationPath(id: string) {
  const direct = /^direct-(\d+)$/.exec(id);
  if (direct) return `${API_BASE}/api/messages/direct/conversations/${direct[1]}`;
  const booking = /^booking-(\d+)$/.exec(id);
  if (booking) return `${API_BASE}/api/messages/bookings/${booking[1]}`;
  return null;
}
function normalizeConversation(c: any): Conversation {
  return {
    ...c,
    id: String(c.id),
    professional_name: String(c.professional_name || 'Home professional'),
    professional_avatar: c.professional_avatar ?? null,
    booking_reference: c.booking_reference ?? null,
    service_name: String(c.service_name || 'Home service'),
    category: String(c.category || 'Other'),
    booking_status: String(c.booking_status || 'Pending'),
    last_message: c.last_message ?? null,
    last_message_at: c.last_message_at ?? null,
    unread_count: Number(c.unread_count || 0),
    created_at: String(c.created_at || new Date().toISOString()),
    is_demo: false,
  };
}
export function useMessaging(userId: string | undefined): UseMessagingResult {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async (silent = false) => {
    const a = auth();
    if (!userId || !a.token) {
      setConversations([]);
      setError('Please sign in again to view messages.');
      setLoading(false);
      return;
    }
    if (!silent) { setLoading(true); setError(null); }
    try {
      const headers = { Authorization: `Bearer ${a.token}`, Accept: 'application/json' };
      const [bookingResponse, directResponse] = await Promise.all([
        fetch(`${API_BASE}/api/messages/conversations/customer/${encodeURIComponent(String(userId))}`, { headers }),
        fetch(`${API_BASE}/api/messages/direct/conversations/customer/${encodeURIComponent(String(userId))}`, { headers }),
      ]);
      const bookingData = await bookingResponse.json().catch(() => []);
      const directData = await directResponse.json().catch(() => []);
      if (!bookingResponse.ok) throw new Error(bookingData?.message || `Messages API returned HTTP ${bookingResponse.status}`);
      if (!directResponse.ok) throw new Error(directData?.message || `Direct messages API returned HTTP ${directResponse.status}`);
      const bookings = Array.isArray(bookingData) ? bookingData : [];
      const direct = Array.isArray(directData) ? directData : [];
      setConversations([...bookings, ...direct].map(normalizeConversation).sort((a, b) => {
        const da = new Date(a.last_message_at || a.created_at).getTime();
        const db = new Date(b.last_message_at || b.created_at).getTime();
        return db - da;
      }));
    } catch (e) {
      if (!silent) { setConversations([]); setError(e instanceof Error ? e.message : 'Could not load messages.'); }
    } finally { if (!silent) setLoading(false); }
  }, [userId]);

  useEffect(() => {
    void fetchConversations();
    let inFlight = false;
    const refresh = () => {
      if (document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      void fetchConversations(true).finally(() => { inFlight = false; });
    };
    const timer = window.setInterval(refresh, 15000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [fetchConversations]);

  const getMessages = useCallback(async (id: string): Promise<Message[]> => {
    const path = conversationPath(id);
    const a = auth();
    if (!path || !a.token) return [];
    try {
      const r = await fetch(path, { headers: { Authorization: `Bearer ${a.token}`, Accept: 'application/json' } });
      const d = await r.json().catch(() => []);
      if (!r.ok) throw new Error(d?.message || 'Could not load conversation.');
      return Array.isArray(d) ? d as Message[] : [];
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load messages.');
      return [];
    }
  }, []);

  const sendMessage = useCallback(async (id: string, content: string): Promise<{ error: string | null }> => {
    const path = conversationPath(id);
    const a = auth();
    if (!path) return { error: 'This conversation could not be identified.' };
    if (!a.token) return { error: 'Please sign in again.' };
    try {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${a.token}`, Accept: 'application/json' },
        body: JSON.stringify({ content }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return { error: d?.message || `Could not send message (HTTP ${r.status}).` };
      await fetchConversations();
      return { error: null };
    } catch {
      return { error: 'Could not connect to HomeServe backend.' };
    }
  }, [fetchConversations]);

  const markRead = useCallback(async (_id: string) => { await fetchConversations(); }, [fetchConversations]);
  return { conversations, usingDemo: false, loading, error, getMessages, sendMessage, markRead };
}
