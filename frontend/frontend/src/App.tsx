import { lazy, Suspense, useEffect, useState } from 'react';

// Split role-specific screens into separate bundles so the initial login bundle stays small.
const AuthPage = lazy(() => import('@/components/AuthPage'));
const UserDashboard = lazy(() => import('@/components/UserDashboard'));
const WorkerDashboard = lazy(() => import('@/components/WorkerDashboard'));

function PageLoading() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, color: '#64748b' }}>
      <div role="status" aria-live="polite">Loading HomeServe…</div>
    </main>
  );
}

export type AuthUser = {
  id?: number | string;
  fullName?: string;
  name?: string;
  email: string;
  role: string;
  token?: string;
  [key: string]: unknown;
};

const AUTH_STORAGE_KEY = 'homeserve.auth.user';

function readSavedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'email' in parsed &&
      'role' in parsed &&
      'token' in parsed &&
      typeof parsed.email === 'string' &&
      typeof parsed.role === 'string' &&
      typeof parsed.token === 'string'
    ) {
      return parsed as AuthUser;
    }
  } catch {
    // Ignore malformed or stale local session data.
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return null;
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(() => readSavedUser());

  useEffect(() => {
    if (user?.token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [user]);

  const signOut = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  if (!user) {
    return <Suspense fallback={<PageLoading />}><AuthPage onComplete={setUser} /></Suspense>;
  }

  const role = user.role?.toUpperCase();

  if (role === 'CUSTOMER' || role === 'USER') {
    return <Suspense fallback={<PageLoading />}><UserDashboard user={user} onSignOut={signOut} /></Suspense>;
  }

  if (role === 'WORKER') {
    return <Suspense fallback={<PageLoading />}><WorkerDashboard user={user} onSignOut={signOut} /></Suspense>;
  }

  return (
    <main style={{ padding: 40, textAlign: 'center' }}>
      <h2>HomeServe</h2>
      <p>Signed in as {user.role}.</p>
      <p>The dashboard for this account type has not been connected yet.</p>
      <button onClick={signOut}>Sign out</button>
    </main>
  );
}

export default App;
