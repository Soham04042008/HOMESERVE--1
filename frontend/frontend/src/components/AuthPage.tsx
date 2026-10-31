import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, Eye, EyeOff,
  HardHat, Home, LockKeyhole, Mail, UserRound,
} from 'lucide-react';
import type { AuthUser } from '@/App';

type AccountRole = 'customer' | 'worker';
type AuthPageProps = { onComplete: (user: AuthUser) => void };

const roleFromPath = (): AccountRole | null => {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/login/customer') || path.startsWith('/register/customer')) return 'customer';
  if (path.startsWith('/login/worker') || path.startsWith('/register/worker')) return 'worker';
  return null;
};

export default function AuthPage({ onComplete }: AuthPageProps) {
  const initialRole = roleFromPath();
  const [role, setRole] = useState<AccountRole>(initialRole ?? 'customer');
  const [isSignUp, setIsSignUp] = useState(window.location.pathname.toLowerCase().startsWith('/register/'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceCategory, setServiceCategory] = useState('Plumbing');
  const [experienceYears, setExperienceYears] = useState('0');
  const [city, setCity] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isChooser = initialRole === null;
  const title = role === 'customer' ? 'Customer' : 'Worker';
  const Icon = role === 'customer' ? UserRound : HardHat;

  const navigate = (path: string) => { window.location.href = path; };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
      const endpoint = role === 'worker'
        ? (isSignUp ? '/api/workers/register' : '/api/workers/login')
        : (isSignUp ? '/api/auth/register' : '/api/auth/login');
      const payload = isSignUp
        ? role === 'worker'
          ? { fullName: fullName.trim(), email: email.trim(), password, phone: phone.trim(), serviceCategory, experienceYears: Number(experienceYears), city: city.trim(), state: 'Maharashtra', pincode: '' }
          : { fullName: fullName.trim(), email: email.trim(), password, phone: phone.trim(), role: 'CUSTOMER' }
        : { email: email.trim(), password };

      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const data = result as Record<string, unknown>;
        setMessage(typeof data.message === 'string' ? data.message : typeof data.detail === 'string' ? data.detail : 'Unable to continue. Please check your details and try again.');
        return;
      }
      const data = result as Record<string, unknown>;
      const userData = data.user && typeof data.user === 'object' ? data.user as Record<string, unknown> : data;
      const rawRole = typeof userData.role === 'string' ? userData.role.toUpperCase() : '';
      const normalizedRole = rawRole === 'USER' ? 'CUSTOMER' : rawRole;
      const expectedRole = role === 'customer' ? 'CUSTOMER' : 'WORKER';
      if (normalizedRole && normalizedRole !== expectedRole) {
        setMessage(`This account is not registered as a ${title.toLowerCase()} account. Please use the correct login page.`);
        return;
      }
      const token = typeof data.token === 'string' ? data.token : typeof userData.token === 'string' ? userData.token : undefined;
      onComplete({
        ...userData,
        email: typeof userData.email === 'string' ? userData.email : email.trim(),
        role: normalizedRole || expectedRole,
        ...(token ? { token } : {}),
      } as AuthUser);
    } catch {
      setMessage('Cannot connect to HomeServe. Please make sure the Java backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`auth-page ${isChooser ? 'auth-chooser-page' : ''}`}>
      <section className="auth-visual">
        <button className="auth-brand auth-brand-button" type="button" onClick={() => navigate('/')}>
          <span className="auth-brand-mark"><Home size={19} /></span><span>HomeServe</span>
        </button>
        <div className="auth-visual-copy">
          <span className="eyebrow">HOME CARE, MADE SIMPLE</span>
          <h1>{role === 'customer' ? 'A better way to care for your home.' : 'Your skills. More opportunities.'}</h1>
          <p>{role === 'customer'
            ? 'Find skilled local professionals, book trusted home services and manage every appointment in one place.'
            : 'Manage your services, connect with customers and keep your work organised with HomeServe.'}</p>
        </div>
        <div className="auth-visual-footer"><span>Home services, made easier across Mumbai</span><span className="auth-dots"><i /><i /><i /></span></div>
      </section>

      <section className="auth-panel">
        <div className="auth-content">
          <div className="auth-mobile-brand"><span className="auth-brand-mark"><Home size={18} /></span><span>HomeServe</span></div>
          {isChooser ? (
            <>
              <span className="auth-kicker">WELCOME TO HOMESERVE</span>
              <h2>How would you like to continue?</h2>
              <p className="auth-intro">Choose the account that matches how you use HomeServe.</p>
              <div className="auth-choice-list">
                <button className="auth-choice" type="button" onClick={() => navigate('/login/customer')}>
                  <span className="auth-choice-icon"><UserRound size={22} /></span>
                  <span><strong>Continue as Customer</strong><small>Find professionals and book home services</small></span>
                  <ArrowRight size={19} />
                </button>
                <button className="auth-choice" type="button" onClick={() => navigate('/login/worker')}>
                  <span className="auth-choice-icon"><HardHat size={22} /></span>
                  <span><strong>Continue as Worker</strong><small>Manage your services and appointments</small></span>
                  <ArrowRight size={19} />
                </button>
              </div>
              <p className="auth-note">Secure access to your HomeServe account.</p>
            </>
          ) : (
            <>
              <button className="auth-back" type="button" onClick={() => navigate('/')}><ArrowLeft size={16} /> Choose account type</button>
              <span className="auth-kicker">{isSignUp ? 'JOIN HOMESERVE' : 'WELCOME BACK'}</span>
              <h2>{isSignUp ? `Create your ${title.toLowerCase()} account` : `${title} sign in`}</h2>
              <p className="auth-intro">{role === 'customer' ? 'Sign in to book and manage your home services.' : 'Sign in to manage your work and appointments.'}</p>
              <div className="auth-role-chip"><span className="auth-choice-icon"><Icon size={18} /></span><span><strong>{title} account</strong><small>{role === 'customer' ? 'Book trusted home services' : 'Manage jobs and appointments'}</small></span></div>
              <form onSubmit={handleSubmit} className="auth-form">
                {isSignUp && <label>Full name<div className="auth-input-wrap"><UserRound size={17} /><input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your full name" required autoComplete="name" /></div></label>}
                <label>Email address<div className="auth-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" /></div></label>
                {isSignUp && <label>Phone number <span className="auth-optional">(optional)</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter phone number" autoComplete="tel" /></label>}
                {isSignUp && role === 'worker' && <>
                  <label>Primary service category<select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}><option>Plumbing</option><option>Electrical</option><option>Carpentry</option><option>Painting</option><option>Cleaning</option><option>AC Repair</option><option>Handyman</option></select></label>
                  <div className="auth-two-fields"><label>Experience (years)<input type="number" min="0" max="60" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} /></label><label>City<input value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Airoli" /></label></div>
                </>}
                <label>Password<div className="password-field"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={isSignUp ? 'Create a password' : 'Enter your password'} required minLength={8} autoComplete={isSignUp ? 'new-password' : 'current-password'} /><button type="button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
                {message && <p className="auth-message" role="alert">{message}</p>}
                <button className="auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait...' : isSignUp ? `Create ${title.toLowerCase()} account` : `Sign in as ${title}`}<BriefcaseBusiness size={17} /></button>
              </form>
              <button className="auth-switch" type="button" onClick={() => { setIsSignUp(v => !v); setMessage(''); navigate(isSignUp ? `/login/${role}` : `/register/${role}`); }}>
                {isSignUp ? 'Already have an account? Sign in' : 'New to HomeServe? Create an account'}
              </button>
              <p className="auth-note">By continuing, you agree to HomeServe&apos;s terms and privacy policy.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
