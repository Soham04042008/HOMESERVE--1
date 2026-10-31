import { useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@/App';
import {
  BadgeCheck, Bell, CalendarDays, Check, ChevronRight, Home,
  Images, IndianRupee, LogOut, Menu, Star, User, Wrench, X, MessageCircle,
} from 'lucide-react';
import WorkerSpace from '@/components/WorkerSpace';
import NotificationsPage from '@/components/NotificationsPage';
import type { WorkerTab } from '@/lib/worker';
import { useNotificationCount } from '@/lib/useNotificationCount';

type Props = {
  user: AuthUser;
  onSignOut: () => void;
};

type WorkerNavLabel = 'Overview' | 'My Profile' | 'My Services' | 'My Bookings' | 'Portfolio' | 'Reviews' | 'Messages' | 'Notifications' | 'Earnings';

const navItems: Array<{ label: WorkerNavLabel; tab: WorkerTab | null; icon: typeof Home }> = [
  { label: 'Overview', tab: 'overview', icon: Home },
  { label: 'My Profile', tab: 'profile', icon: User },
  { label: 'My Services', tab: 'services', icon: Wrench },
  { label: 'My Bookings', tab: 'bookings', icon: CalendarDays },
  { label: 'Portfolio', tab: 'portfolio', icon: Images },
  { label: 'Reviews', tab: 'reviews', icon: Star },
  { label: 'Messages', tab: 'messages', icon: MessageCircle },
  { label: 'Notifications', tab: null, icon: Bell },
  { label: 'Earnings', tab: null, icon: IndianRupee },
];

export default function WorkerDashboard({ user, onSignOut }: Props) {
  const [active, setActive] = useState<WorkerNavLabel>('Overview');
  const unreadNotificationCount = useNotificationCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [earningsBookings, setEarningsBookings] = useState<Array<{id: number; serviceName: string; customerName: string; price: number; status: string; bookingDate: string; bookingTime: string}>>([]);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [earningsError, setEarningsError] = useState('');
  const displayName = user.fullName || user.name || 'Worker';
  const avatarText = displayName.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
  // WorkerSpace requires a string ID. Fall back to email if the API omits an ID.
  const userId = String(user.id ?? user.email);
  const userEmail = user.email ?? '';

  const workerTab: WorkerTab | null = navItems.find((n) => n.label === active)?.tab ?? null;
  useEffect(() => {
    if (active !== 'Earnings') return;
    let cancelled = false;
    const loadEarnings = async () => {
      setEarningsLoading(true); setEarningsError('');
      try {
        const raw = window.localStorage.getItem('homeserve.auth.user');
        const auth = raw ? JSON.parse(raw) as { token?: string; accessToken?: string; access_token?: string } : {};
        const token = auth.token || auth.accessToken || auth.access_token;
        if (!token) throw new Error('Please sign out and sign in again to load earnings.');
        const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
        const response = await fetch(`${apiBase}/api/bookings/worker/${encodeURIComponent(String(user.id ?? user.email))}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
        const body = await response.json().catch(() => []);
        if (!response.ok) throw new Error(body?.message || `Could not load earnings (HTTP ${response.status}).`);
        if (!cancelled) setEarningsBookings(Array.isArray(body) ? body : []);
      } catch (error) { if (!cancelled) setEarningsError(error instanceof Error ? error.message : 'Could not load earnings.'); }
      finally { if (!cancelled) setEarningsLoading(false); }
    };
    void loadEarnings();
    return () => { cancelled = true; };
  }, [active, user.id, user.email]);

  const earnings = useMemo(() => {
    const completed = earningsBookings.filter((b) => String(b.status).toUpperCase() === 'COMPLETED');
    const now = new Date();
    const month = completed.filter((b) => { const d = new Date(`${b.bookingDate}T${b.bookingTime || '00:00'}`); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    return { completed, total: completed.reduce((sum, b) => sum + Number(b.price || 0), 0), month: month.reduce((sum, b) => sum + Number(b.price || 0), 0) };
  }, [earningsBookings]);


  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  const handleNavClick = (label: WorkerNavLabel) => {
    setActive(label);
    setMenuOpen(false);
    if (label === 'Earnings') {
      showNotice('Earnings details are loading.');
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Home size={19} strokeWidth={2.5} /></div>
          <span>HomeServe <span className="sidebar-role-tag">Worker</span></span>
          <button className="close-menu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <div className="worker-sidebar-profile">
          <span className="worker-sidebar-avatar">{avatarText}</span>
          <div>
            <strong>{displayName}</strong>
            <span><BadgeCheck size={12} /> Worker Account</span>
          </div>
        </div>
        <nav className="main-nav" aria-label="Worker navigation">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${active === label ? 'active' : ''}`}
              onClick={() => handleNavClick(label)}
            >
              <Icon size={20} strokeWidth={active === label ? 2.5 : 1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => void onSignOut()}><LogOut size={20} /><span>Logout</span></button>
          <div className="help-card"><span>Need help with your worker account?</span><button onClick={() => showNotice('Our worker support team will be in touch shortly.')}>Get support <ChevronRight size={14} /></button></div>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <button className="menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22} /></button>
          <span className="topbar-title">Worker Space</span>
          <div className="topbar-actions">
            <button className="icon-button notification-bell-button" onClick={() => setActive('Notifications')} aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`}><Bell size={21} />{unreadNotificationCount > 0 && <span className="notification-count-badge">{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>}</button>
            <button className="avatar" onClick={() => void onSignOut()} aria-label="Sign out">{avatarText}</button>
          </div>
        </header>

        <main className="content">
          {active === 'Notifications' ? (
            <NotificationsPage onOpenBooking={() => setActive('My Bookings')} onOpenMessages={() => setActive('Messages')} />
          ) : workerTab ? (
            <WorkerSpace
              userId={userId}
              email={userEmail}
              fullName={displayName}
              activeTab={workerTab}
              onTabChange={(t) => {
                const item = navItems.find((n) => n.tab === t);
                if (item) setActive(item.label);
              }}
              hideInternalTabs
            />
          ) : (
            <div className="worker-placeholder">
              {active === 'Earnings' && <EarningsPlaceholder bookings={earnings.completed} total={earnings.total} month={earnings.month} loading={earningsLoading} error={earningsError} />}
            </div>
          )}
        </main>
      </div>
      {notice && <div className="toast"><Check size={17} />{notice}</div>}
    </div>
  );
}

function EarningsPlaceholder({ bookings, total, month, loading, error }: { bookings: Array<{id: number; serviceName: string; customerName: string; price: number; bookingDate: string; bookingTime: string}>; total: number; month: number; loading: boolean; error: string }) {
  const money = (value: number) => '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  return (
    <div className="worker-earnings-page">
      <h2>Earnings Overview</h2>
      <p>Estimated earnings from completed jobs. This is not confirmation of a bank or online payment.</p>
      {error && <div className="worker-error">{error}</div>}
      {loading ? <div className="worker-loading">Loading earnings...</div> : <>
        <div className="worker-stats-grid">
          <div className="worker-stat-card"><span>Total from completed jobs</span><strong>{money(total)}</strong></div>
          <div className="worker-stat-card"><span>This month</span><strong>{money(month)}</strong></div>
          <div className="worker-stat-card"><span>Completed jobs</span><strong>{bookings.length}</strong></div>
        </div>
        <div className="worker-earnings-list"><h3>Completed jobs</h3>
          {bookings.length === 0 ? <p>No completed jobs yet. Earnings will appear here after a booking is marked Completed.</p> : bookings.map((b) => <div className="worker-earnings-row" key={b.id}><div><strong>{b.serviceName || 'Home service'}</strong><span>{b.customerName || 'Customer'} · {b.bookingDate || ''}</span></div><strong>{money(Number(b.price || 0))}</strong></div>)}
        </div>
      </>}
    </div>
  );
}
