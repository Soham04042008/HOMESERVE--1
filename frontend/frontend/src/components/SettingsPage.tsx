import { useState, type FormEvent } from 'react';
import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  UserRound,
  Mail,
  Smartphone,
} from 'lucide-react';
import type { AuthUser } from '@/App';
import './settings-page.css';

type SettingsPageProps = { user: AuthUser };

export default function SettingsPage({ user }: SettingsPageProps) {
  const [bookingUpdates, setBookingUpdates] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [serviceReminders, setServiceReminders] = useState(false);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [theme, setTheme] = useState<'light' | 'system'>('light');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [saved, setSaved] = useState(false);

  function savePreferences() {
    const preferences = {
      bookingUpdates,
      messageAlerts,
      serviceReminders,
      emailUpdates,
      theme,
    };
    try {
      window.localStorage.setItem('homeserve-settings', JSON.stringify(preferences));
    } catch {
      // Preferences remain usable for the current page if storage is unavailable.
    }
    setSaved(true);
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage('');
    if (newPassword.length < 8) {
      setPasswordMessage('Your new password must contain at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage('The new password and confirmation do not match.');
      return;
    }
    setPasswordMessage('Password form validated. Connect your backend password API to update it securely.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  const displayName = user.fullName || user.name || user.email?.split('@')[0] || 'HomeServe user';

  return (
    <section className="settings-page">
      <div className="settings-page-heading">
        <div>
          <span className="settings-eyebrow">PREFERENCES & SECURITY</span>
          <h1>Settings</h1>
          <p>Personalise your HomeServe experience and manage your account preferences.</p>
        </div>
        <div className="settings-heading-icon"><ShieldCheck size={25} /></div>
      </div>

      {saved && (
        <div className="settings-saved-banner" role="status">
          <CheckCircle2 size={18} /> Your preferences have been saved on this device.
          <button type="button" onClick={() => setSaved(false)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="settings-content-grid">
        <div className="settings-main-column">
          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-card-icon"><Bell size={20} /></span>
              <div><h2>Notifications</h2><p>Choose which updates you would like to receive.</p></div>
            </div>
            <div className="settings-options">
              <SettingToggle icon={<CalendarCheck size={18} />} title="Booking updates" description="Booking confirmations, status changes and appointments." checked={bookingUpdates} onChange={setBookingUpdates} />
              <SettingToggle icon={<Mail size={18} />} title="Messages" description="Get notified when a professional sends you a message." checked={messageAlerts} onChange={setMessageAlerts} />
              <SettingToggle icon={<Bell size={18} />} title="Home service reminders" description="Helpful reminders for maintenance and upcoming services." checked={serviceReminders} onChange={setServiceReminders} />
              <SettingToggle icon={<Smartphone size={18} />} title="Email updates" description="Receive important account and service updates by email." checked={emailUpdates} onChange={setEmailUpdates} />
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-card-icon"><Palette size={20} /></span>
              <div><h2>Appearance</h2><p>Choose how HomeServe looks on this device.</p></div>
            </div>
            <div className="settings-theme-options">
              <button type="button" className={`settings-theme-choice ${theme === 'light' ? 'selected' : ''}`} onClick={() => { setTheme('light'); setSaved(false); }} aria-pressed={theme === 'light'}>
                <span className="settings-theme-preview light-preview"><Sun size={21} /></span>
                <span><strong>Light theme</strong><small>Clean and bright</small></span>
                <span className="settings-radio" />
              </button>
              <button type="button" className={`settings-theme-choice ${theme === 'system' ? 'selected' : ''}`} onClick={() => { setTheme('system'); setSaved(false); }} aria-pressed={theme === 'system'}>
                <span className="settings-theme-preview system-preview"><Moon size={21} /></span>
                <span><strong>System default</strong><small>Use your device preference</small></span>
                <span className="settings-radio" />
              </button>
            </div>
            {theme === 'system' && <p className="settings-inline-note">System theme preference is selected. Applying a full dark theme requires adding theme styles across the dashboard.</p>}
          </section>

          <section className="settings-card">
            <div className="settings-card-heading">
              <span className="settings-card-icon"><LockKeyhole size={20} /></span>
              <div><h2>Password & security</h2><p>Keep your HomeServe account secure.</p></div>
            </div>
            <form className="settings-password-form" onSubmit={handlePasswordSubmit}>
              <label className="settings-input-field"><span>Current password</span><input required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" /></label>
              <label className="settings-input-field"><span>New password</span><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 8 characters" /></label>
              <label className="settings-input-field"><span>Confirm new password</span><input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" /></label>
              <button type="button" className="settings-show-password" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}{showPassword ? 'Hide passwords' : 'Show passwords'}</button>
              {passwordMessage && <p className="settings-password-message" role="status">{passwordMessage}</p>}
              <button className="settings-secondary-button" type="submit">Validate password change <ChevronRight size={16} /></button>
              <p className="settings-security-note"><ShieldCheck size={15} /> Password changes need a secure backend endpoint before they can take effect.</p>
            </form>
          </section>
        </div>

        <aside className="settings-side-column">
          <section className="settings-account-card">
            <div className="settings-account-avatar"><UserRound size={26} /></div>
            <span className="settings-account-label">SIGNED-IN ACCOUNT</span>
            <h2>{displayName}</h2>
            <p>{user.email}</p>
            <span className="settings-account-role"><ShieldCheck size={14} /> {user.role || 'Customer'}</span>
            <div className="settings-account-divider" />
            <div className="settings-account-row"><Mail size={16} /><span>{user.email}</span></div>
            <p className="settings-account-caption">Your account details are managed from your Profile page.</p>
          </section>
          <section className="settings-help-card">
            <span className="settings-help-icon"><ShieldCheck size={20} /></span>
            <h2>Your privacy matters</h2>
            <p>Keep your contact details up to date and never share your password with anyone.</p>
            <div className="settings-help-line"><CheckCircle2 size={15} /> Account preferences</div>
            <div className="settings-help-line"><CheckCircle2 size={15} /> Secure sign-in guidance</div>
          </section>
        </aside>
      </div>

      <div className="settings-footer-actions">
        <p>Changes to preferences are stored locally on this device.</p>
        <button type="button" className="settings-save-button" onClick={savePreferences}><CheckCircle2 size={17} /> Save preferences</button>
      </div>
    </section>
  );
}

type SettingToggleProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function SettingToggle({ icon, title, description, checked, onChange }: SettingToggleProps) {
  return (
    <div className="settings-option-row">
      <span className="settings-option-icon">{icon}</span>
      <div className="settings-option-copy"><h3>{title}</h3><p>{description}</p></div>
      <button type="button" role="switch" aria-checked={checked} aria-label={title} className={`settings-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><span /></button>
    </div>
  );
}
