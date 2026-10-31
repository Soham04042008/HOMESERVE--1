
import { useEffect, useState, type FormEvent } from 'react';
import type { AuthUser } from '@/App';
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Save,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import './profile-page.css';

type ProfilePageProps = {
  user: AuthUser;
};

type ProfileData = {
  id?: number;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  role?: string;
};

const API_URL = 'http://localhost:8080/api/users/me';

// Read the token saved by the login page.

function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('homeserve.auth.user');

    if (!raw) return null;

    const savedUser = JSON.parse(raw);

    if (
      savedUser &&
      typeof savedUser.token === 'string' &&
      savedUser.token.trim() !== ''
    ) {
      return savedUser.token;
    }

    return null;
  } catch {
    return null;
  }
}


export default function ProfilePage({ user }: ProfilePageProps) {
  const initialName =
    user.fullName || user.name || user.email?.split('@')[0] || '';

  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(
    typeof user.phone === 'string' ? user.phone : ''
  );
  const [address, setAddress] = useState(
    typeof user.address === 'string' ? user.address : ''
  );

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load the actual saved profile from the backend.
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const token = getAuthToken();

      if (!token) {
        if (active) {
          setError(
            'Login session token not found. Please sign in again.'
          );
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch(API_URL, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.message || 'Could not load your profile.'
          );
        }

        if (!active) return;

        setFullName(data.fullName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load your profile.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const initials = (fullName || 'User')
    .trim()
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setError('Login session token not found. Please sign in again.');
      return;
    }

    setSaving(true);
    setSaved(false);
    setError('');

    const requestBody = {
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      address: address.trim(),
    };

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            (response.status === 401
              ? 'Your session has expired. Please sign in again.'
              : response.status === 409
                ? 'This email address is already in use.'
                : 'Failed to update your profile.')
        );
      }

      // Use the values returned by the backend.
      setFullName(data.fullName ?? requestBody.fullName);
      setEmail(data.email ?? requestBody.email);
      setPhone(data.phone ?? requestBody.phone);
      setAddress(data.address ?? requestBody.address);

      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving your profile.'
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    // Reload the persisted values rather than keeping unsaved edits.
    setEditing(false);
    setSaved(false);
    setError('');

    const token = getAuthToken();

    if (!token) return;

    fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || 'Could not reload profile.');
        }

        setFullName(data.fullName ?? '');
        setEmail(data.email ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : 'Could not reload profile.'
        );
      });
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div>
          <span className="profile-eyebrow">ACCOUNT SETTINGS</span>
          <h1>My Profile</h1>
          <p>Manage your personal information and account details.</p>
        </div>

        {!editing && (
          <button
            type="button"
            className="profile-edit-button"
            disabled={loading || saving}
            onClick={() => {
              setSaved(false);
              setError('');
              setEditing(true);
            }}
          >
            <Pencil size={16} /> Edit Profile
          </button>
        )}
      </div>

      {loading && <p role="status">Loading your saved profile...</p>}

      <div className="profile-layout">
        <aside className="profile-summary">
          <div className="profile-avatar">{initials || 'U'}</div>
          <h2>{fullName || 'Your Name'}</h2>
          <p className="profile-summary-email">{email}</p>

          <span className="profile-role">
            <ShieldCheck size={15} /> {user.role || 'Customer'}
          </span>

          <div className="profile-summary-divider" />

          <div className="profile-summary-item">
            <Mail size={17} />
            <span>{email || 'Email not added'}</span>
          </div>

          <div className="profile-summary-item">
            <Phone size={17} />
            <span>{phone || 'Phone not added'}</span>
          </div>

          <div className="profile-summary-item">
            <MapPin size={17} />
            <span>{address || 'Address not added'}</span>
          </div>
        </aside>

        <div className="profile-details-card">
          <div className="profile-card-heading">
            <div className="profile-card-icon">
              <UserRound size={21} />
            </div>
            <div>
              <h2>Personal Information</h2>
              <p>Your basic contact information</p>
            </div>
          </div>

          {saved && (
            <div className="profile-success" role="status">
              <CheckCircle2 size={18} />
              Profile updated successfully!
            </div>
          )}

          {error && (
            <div className="profile-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="profile-form-grid">
              <label className="profile-field">
                <span>Full Name</span>
                <div className="profile-input-wrap">
                  <UserRound size={17} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    disabled={!editing || saving}
                    required
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Email Address</span>
                <div className="profile-input-wrap">
                  <Mail size={17} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={!editing || saving}
                    required
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Phone Number</span>
                <div className="profile-input-wrap">
                  <Phone size={17} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
                    disabled={!editing || saving}
                  />
                </div>
              </label>

              <label className="profile-field">
                <span>Home Address</span>
                <div className="profile-input-wrap">
                  <MapPin size={17} />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your home address"
                    disabled={!editing || saving}
                  />
                </div>
              </label>
            </div>

            <div className="profile-form-footer">
              <p>
                <ShieldCheck size={16} /> Your account information
              </p>

              {editing && (
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X size={16} /> Cancel
                  </button>

                  <button
                    type="submit"
                    className="profile-save-button"
                    disabled={saving || loading}
                  >
                    <Save size={16} />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
