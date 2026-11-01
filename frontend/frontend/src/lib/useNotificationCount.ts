import { useEffect, useState } from 'react';

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

function getToken(): string {
  try {
    const saved = JSON.parse(localStorage.getItem('homeserve.auth.user') || '{}');
    return saved.token || saved.accessToken || saved.access_token || '';
  } catch {
    return '';
  }
}

/** Polls only the unread count; it does not download the notification list. */
export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let stopped = false;
    let inFlight = false;

    const load = async () => {
      if (document.visibilityState !== 'visible' || inFlight) return;
      const token = getToken();
      if (!token) {
        setCount(0);
        return;
      }
      inFlight = true;
      try {
        const response = await fetch(`${API}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        if (!response.ok) return;
        const body = await response.json();
        if (!stopped) setCount(Math.max(0, Number(body.unreadCount) || 0));
      } catch {
        // Keep the last known count during temporary network interruptions.
      } finally {
        inFlight = false;
      }
    };

    void load();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void load(); }, 20000);
    const onFocus = () => void load();
    window.addEventListener('focus', onFocus);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return count;
}
