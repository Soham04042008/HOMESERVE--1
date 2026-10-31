import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Edit3,
  Eye,
  Images,
  IndianRupee,
  MapPin,
  MessageCircle,
  Send,
  Plus,
  Search,
  Star,
  Trash2,
  TrendingUp,
  User,
  Wrench,
  X,
} from 'lucide-react';
import {
  type AvailabilityStatus,
  type PricingType,
  type QualificationType,
  type WorkerBookingStatus,
  type WorkerPortfolioItem,
  type WorkerProfile,
  type WorkerService,
  type WorkerTab,
  formatPrice,
  formatPriceRange,
  mumbaiAreas,
  pricingTypes,
  profileCompletion,
  serviceCategories,
} from '@/lib/worker';
import { useWorker } from '@/lib/useWorker';
import '@/components/messages.css';

type Props = {
  userId: string;
  email: string;
  fullName: string;
  activeTab?: WorkerTab;
  onTabChange?: (tab: WorkerTab) => void;
  hideInternalTabs?: boolean;
};

const tabs: { id: WorkerTab; label: string; icon: typeof User }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'profile', label: 'Profile', icon: Edit3 },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'portfolio', label: 'Portfolio', icon: Images },
];

const bookingTabs: (WorkerBookingStatus | 'All')[] = ['All', 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];

export default function WorkerSpace({ userId, email, fullName, activeTab, onTabChange, hideInternalTabs }: Props) {
  const w = useWorker(userId, email, fullName);
  const [internalTab, setInternalTab] = useState<WorkerTab>('overview');
  const tab = activeTab ?? internalTab;
  const setTab = (t: WorkerTab) => {
    if (onTabChange) onTabChange(t);
    else setInternalTab(t);
  };
  const [toast, setToast] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [messageBookingId, setMessageBookingId] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(''), 2600); };

  if (w.loading) return <div className="worker-loading">Loading your worker space...</div>;

  return (
    <div className="worker-page">
      <div className="worker-header">
        <div className="worker-header-left">
          {w.profile.avatar ? <img src={w.profile.avatar} alt={w.profile.full_name} className="worker-avatar" /> : <span className="worker-avatar-fallback">{w.profile.full_name[0] ?? 'W'}</span>}
          <div>
            <span className="eyebrow">Worker Space</span>
            <h1>Welcome, {w.profile.full_name.split(' ')[0]}</h1>
            <p className="worker-subtitle">{w.profile.headline || 'Set up your professional headline to attract customers.'}</p>
            <div className="worker-badges">
              <span className={`avail-badge ${w.profile.availability_status.toLowerCase()}`}><Clock size={12} /> {w.profile.availability_status}</span>
            </div>
          </div>
        </div>
        <div className="worker-header-right">
          <div className="completion-ring">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#e0e6f0" strokeWidth="5" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="#0b1c30" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(profileCompletion(w.profile) / 100) * 150.8} 150.8`} transform="rotate(-90 28 28)" />
            </svg>
            <span>{profileCompletion(w.profile)}%</span>
          </div>
          <button className="outline-button" onClick={() => setShowPreview(true)}><Eye size={16} /> Preview Public Profile</button>
        </div>
      </div>

      {w.error && <div className="worker-error">{w.error}</div>}

      {!hideInternalTabs && (
        <div className="worker-tabs">
          {tabs.map((t) => (
            <button key={t.id} className={`worker-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>
      )}

      <div className="worker-content">
        {tab === 'overview' && <Overview w={w} onTab={setTab} />}
        {tab === 'profile' && <ProfileSection w={w} showToast={showToast} />}
        {tab === 'services' && <ServicesSection w={w} showToast={showToast} />}
        {tab === 'bookings' && <BookingsSection w={w} showToast={showToast} onMessage={(bookingId) => { setMessageBookingId(bookingId); setTab('messages'); }} />}
        {tab === 'reviews' && <ReviewsSection w={w} />}
        {tab === 'messages' && <WorkerMessagesSection userId={userId} initialBookingId={messageBookingId} />}
        {tab === 'portfolio' && <PortfolioSection w={w} showToast={showToast} />}
      </div>

      {showPreview && <PublicProfileModal profile={w.profile} services={w.services} reviews={w.reviews} portfolio={w.portfolio} onClose={() => setShowPreview(false)} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

type W = ReturnType<typeof useWorker>;

function Overview({ w, onTab }: { w: W; onTab: (t: WorkerTab) => void }) {
  // Derive dashboard figures from the live booking/review lists so the cards
  // cannot show zero while Recent Bookings or Recent Reviews contain records.
  const completedBookings = w.bookings.filter((b) => b.booking_status === 'Completed');
  const pendingBookings = w.bookings.filter((b) => b.booking_status === 'Pending');
  const totalEarnings = completedBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
  const now = new Date();
  const monthlyEarnings = completedBookings.reduce((sum, b) => {
    const date = new Date(b.appointment_at);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      ? sum + Number(b.price || 0) : sum;
  }, 0);
  const validRatings = w.reviews.map((r) => Number(r.rating)).filter((rating) => rating >= 1 && rating <= 5);
  const averageRating = validRatings.length
    ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
    : Number(w.profile.average_rating || 0);
  const stats = [
    { label: 'Total Bookings', value: w.bookings.length, icon: <CalendarDays size={19} />, accent: 'st-blue' },
    { label: 'Completed Jobs', value: completedBookings.length, icon: <CheckCircle2 size={19} />, accent: 'st-green' },
    { label: 'Pending Requests', value: pendingBookings.length, icon: <Clock size={19} />, accent: 'st-amber' },
    { label: 'Avg Rating', value: averageRating.toFixed(1), icon: <Star size={19} />, accent: 'st-blue' },
    { label: 'Total Earnings', value: formatPrice(totalEarnings), icon: <IndianRupee size={19} />, accent: 'st-green' },
    { label: 'This Month', value: formatPrice(monthlyEarnings), icon: <TrendingUp size={19} />, accent: 'st-green' },
  ];
  const quickActions = [
    { label: 'Edit Profile', icon: Edit3, tab: 'profile' as WorkerTab },
    { label: 'Manage Services', icon: Wrench, tab: 'services' as WorkerTab },
    { label: 'Availability Status', icon: Clock, tab: 'profile' as WorkerTab },
    { label: 'View Bookings', icon: CalendarDays, tab: 'bookings' as WorkerTab },
  ];

  return (
    <div className="worker-overview">
      <div className="worker-stat-grid">
        {stats.map((s) => (
          <div key={s.label} className={`worker-stat-card ${s.accent}`}>
            <span className="stat-icon">{s.icon}</span>
            <div><strong>{s.value}</strong><span>{s.label}</span></div>
          </div>
        ))}
      </div>

      <div className="worker-quick-actions">
        <h3>Quick Actions</h3>
        <div className="qa-grid">
          {quickActions.map((a) => (
            <button key={a.label} className="qa-card" onClick={() => onTab(a.tab)}>
              <span className="qa-icon"><a.icon size={20} /></span>
              <span>{a.label}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </div>

      <div className="worker-two-col">
        <div className="worker-panel">
          <h3>Recent Bookings</h3>
          {w.bookings.length === 0 ? <p className="empty-inline">No bookings yet.</p> : (
            <div className="mini-booking-list">
              {w.bookings.slice(0, 3).map((b) => (
                <div key={b.id} className="mini-booking">
                  <div><strong>{b.service_name}</strong><p>{b.customer_name} • {b.location_area || 'Address not provided'}</p><p>{new Date(b.appointment_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div>
                  <span className={`booking-status-badge ${b.booking_status.toLowerCase().replace(/ /g, '-')}`}>{b.booking_status}</span>
                </div>
              ))}
            </div>
          )}
          <button className="text-button" onClick={() => onTab('bookings')}>View all bookings <ChevronRight size={14} /></button>
        </div>
        <div className="worker-panel">
          <h3>Recent Reviews</h3>
          {w.reviews.length === 0 ? <p className="empty-inline">No reviews yet.</p> : (
            <div className="mini-review-list">
              {w.reviews.slice(0, 3).map((r) => (
                <div key={r.id} className="mini-review">
                  <div className="mini-review-top"><strong>{r.customer_name}</strong><span className="mini-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} fill={i < r.rating ? 'currentColor' : 'none'} />)}</span></div>
                  <p>“{r.comment}”</p>
                </div>
              ))}
            </div>
          )}
          <button className="text-button" onClick={() => onTab('reviews')}>View all reviews <ChevronRight size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ w, showToast }: { w: W; showToast: (m: string) => void }) {
  const [p, setP] = useState<WorkerProfile>(w.profile);
  const [areas, setAreas] = useState(p.preferred_areas.join(', '));
  const [langs, setLangs] = useState(p.languages.join(', '));
  const [charges, setCharges] = useState(p.additional_charges);
  const [availabilityStatus, setAvailabilityStatus] = useState<AvailabilityStatus>(w.profile.availability_status);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvailabilitySave = async () => {
    setAvailabilitySaving(true);
    const { error } = await w.saveAvailability({ status: availabilityStatus });
    setAvailabilitySaving(false);
    showToast(error ? 'Availability update failed: ' + error : 'Availability status updated.');
  };

  // The profile arrives asynchronously from the Spring Boot API. Keep the form in sync
  // after the initial GET and after a successful save instead of retaining blank defaults.
  useEffect(() => {
    setP(w.profile);
    setAreas(w.profile.preferred_areas.join(', '));
    setLangs(w.profile.languages.join(', '));
    setCharges(w.profile.additional_charges);
    setAvailabilityStatus(w.profile.availability_status);
  }, [w.profile]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (p.max_price > 0 && p.min_price > p.max_price) {
      showToast('Save failed: minimum price cannot exceed maximum price.');
      return;
    }
    setSaving(true);
    const patch: Partial<WorkerProfile> = {
      ...p,
      preferred_areas: areas.split(',').map((s) => s.trim()).filter(Boolean),
      languages: langs.split(',').map((s) => s.trim()).filter(Boolean),
      additional_charges: charges,
    };
    try {
      const { error } = await w.saveProfile(patch);
      showToast(error ? 'Save failed: ' + error : 'Profile updated successfully.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="worker-form" onSubmit={handleSave}>
      <div className="form-section worker-profile-availability">
        <h3>Availability Status</h3>
        <p className="private-note">Choose whether customers can find you for new bookings.</p>
        <div className="avail-toggles">
          {(['Available', 'Busy', 'Unavailable'] as AvailabilityStatus[]).map((status) => (
            <button
              type="button"
              key={status}
              className={`avail-toggle ${availabilityStatus === status ? 'active' : ''}`}
              onClick={() => setAvailabilityStatus(status)}
              aria-pressed={availabilityStatus === status}
            >
              <Clock size={15} /> {status}
            </button>
          ))}
        </div>
        <div className="form-actions">
          <button type="button" className="dark-button" onClick={handleAvailabilitySave} disabled={availabilitySaving}>
            {availabilitySaving ? 'Saving...' : 'Save Availability Status'}
          </button>
        </div>
      </div>
      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-grid">
          <Field label="Full name"><input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} required /></Field>
          <Field label="Worker ID"><input value={p.worker_id} disabled /></Field>
          <Field label="Profile photo URL"><input value={p.avatar ?? ''} onChange={(e) => setP({ ...p, avatar: e.target.value || null })} placeholder="https://..." /></Field>
          <Field label="Date of birth"><input type="date" value={p.date_of_birth ?? ''} onChange={(e) => setP({ ...p, date_of_birth: e.target.value || null })} /></Field>
          <Field label="Age (auto)"><input value={p.date_of_birth ? calcAge(p.date_of_birth) + ' years' : ''} disabled /></Field>
          <Field label="Gender (optional)"><input value={p.gender} onChange={(e) => setP({ ...p, gender: e.target.value })} placeholder="Optional" /></Field>
          <Field label="Phone number"><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
          <Field label="Email"><input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></Field>
        </div>
      </div>

      <div className="form-section">
        <h3>Address <small className="private-note">(private — not shown to customers)</small></h3>
        <div className="form-grid">
          <Field label="Complete address"><input value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} /></Field>
          <Field label="City"><input value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} /></Field>
          <Field label="State"><input value={p.state} onChange={(e) => setP({ ...p, state: e.target.value })} /></Field>
          <Field label="PIN code"><input value={p.pincode} onChange={(e) => setP({ ...p, pincode: e.target.value })} /></Field>
        </div>
      </div>

      <div className="form-section">
        <h3>Professional Information</h3>
        <div className="form-grid">
          <Field label="Professional headline" full><input value={p.headline} onChange={(e) => setP({ ...p, headline: e.target.value })} placeholder="e.g. Master Electrician" /></Field>
          <Field label="Short bio" full><textarea value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} rows={3} /></Field>
          <Field label="Years of experience"><input type="number" min={0} value={p.experience_years} onChange={(e) => setP({ ...p, experience_years: Number(e.target.value) })} /></Field>
          <Field label="Preferred working areas (comma-separated)"><input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Panvel, Vashi" /></Field>
          <Field label="Languages spoken (comma-separated)"><input value={langs} onChange={(e) => setLangs(e.target.value)} placeholder="Hindi, English" /></Field>
        </div>
      </div>

      <div className="form-section">
        <h3>Pricing</h3>
        <div className="form-grid">
          <Field label="Starting price (₹)"><input type="number" min={0} value={p.starting_price} onChange={(e) => setP({ ...p, starting_price: Number(e.target.value) })} /></Field>
          <Field label="Minimum price (₹)"><input type="number" min={0} value={p.min_price} onChange={(e) => setP({ ...p, min_price: Number(e.target.value) })} /></Field>
          <Field label="Maximum price (₹)"><input type="number" min={0} value={p.max_price} onChange={(e) => setP({ ...p, max_price: Number(e.target.value) })} /></Field>
          <Field label="Pricing type"><select value={p.pricing_type} onChange={(e) => setP({ ...p, pricing_type: e.target.value as PricingType })}>{pricingTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Visit charge (₹)"><input type="number" min={0} value={p.visit_charge} onChange={(e) => setP({ ...p, visit_charge: Number(e.target.value) })} /></Field>
          <Field label="Negotiable"><label className="toggle-row"><input type="checkbox" checked={p.negotiable} onChange={(e) => setP({ ...p, negotiable: e.target.checked })} /> <span>Allow price negotiation</span></label></Field>
        </div>
        <div className="additional-charges">
          <label className="charges-label">Additional charges</label>
          {charges.map((c, i) => (
            <div key={i} className="charge-row">
              <input value={c.label} onChange={(e) => setCharges((prev) => prev.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x))} placeholder="Description" />
              <input type="number" min={0} value={c.amount} onChange={(e) => setCharges((prev) => prev.map((x, idx) => idx === i ? { ...x, amount: Number(e.target.value) } : x))} placeholder="₹" />
              <button type="button" className="charge-remove" onClick={() => setCharges((prev) => prev.filter((_, idx) => idx !== i))}><X size={15} /></button>
            </div>
          ))}
          <button type="button" className="add-charge-btn" onClick={() => setCharges((prev) => [...prev, { label: '', amount: 0 }])}><Plus size={14} /> Add charge</button>
        </div>
        {p.min_price > p.max_price && p.max_price > 0 && <p className="field-error-inline">Minimum price cannot exceed maximum price.</p>}
      </div>

      <div className="form-section">
        <h3>Qualifications</h3>
        {w.qualifications.length === 0 && <p className="empty-inline">No qualifications added yet.</p>}
        <div className="qual-list">
          {w.qualifications.map((q) => (
            <div key={q.id} className="qual-item">
              <span className="qual-type">{q.type}</span>
              <div className="qual-body"><strong>{q.title}</strong>{q.institution && <p>{q.institution}{q.year ? ` • ${q.year}` : ''}</p>}{q.description && <p className="qual-desc">{q.description}</p>}</div>
              <button type="button" className="icon-remove" onClick={async () => { const { error } = await w.deleteQualification(q.id); showToast(error ? 'Delete failed' : 'Qualification removed.'); }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <AddQualificationForm onAdd={async (q) => { const { error } = await w.addQualification(q); showToast(error ? 'Add failed: ' + error : 'Qualification saved to database.'); return !error; }} />
      </div>

      <div className="form-actions">
        <button type="submit" className="dark-button" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
      </div>
    </form>
  );
}

function AddQualificationForm({ onAdd }: { onAdd: (q: { type: QualificationType; title: string; institution: string; year: number | null; description: string }) => Promise<boolean> }) {
  const [type, setType] = useState<QualificationType>('Education');
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [year, setYear] = useState('');
  const [desc, setDesc] = useState('');
  const [open, setOpen] = useState(false);

  if (!open) return <button type="button" className="add-charge-btn" onClick={() => setOpen(true)}><Plus size={14} /> Add qualification</button>;

  const submit = async () => {
    if (!title.trim()) return;
    const saved = await onAdd({ type, title: title.trim(), institution: institution.trim(), year: year ? Number(year) : null, description: desc.trim() });
    if (saved) { setTitle(''); setInstitution(''); setYear(''); setDesc(''); setOpen(false); }
  };

  return (
    <div className="inline-form">
      <div className="form-grid">
        <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value as QualificationType)}>{['Education','Course','Certificate','Licence','Experience'].map((t) => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Institution"><input value={institution} onChange={(e) => setInstitution(e.target.value)} /></Field>
        <Field label="Year"><input type="number" value={year} onChange={(e) => setYear(e.target.value)} /></Field>
        <Field label="Description" full><input value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      </div>
      <div className="inline-form-actions">
        <button type="button" className="outline-button sm" onClick={() => setOpen(false)}>Cancel</button>
        <button type="button" className="dark-button sm" onClick={submit}>Add</button>
      </div>
    </div>
  );
}

function ServicesSection({ w, showToast }: { w: W; showToast: (m: string) => void }) {
  const [editing, setEditing] = useState<WorkerService | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="worker-services">
      <div className="section-top-row">
        <h3>My Services</h3>
        <button className="dark-button sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={15} /> Add Service</button>
      </div>
      {w.services.length === 0 ? <p className="empty-inline">No services added yet. Add your first service to start receiving bookings.</p> : (
        <div className="worker-service-list">
          {w.services.map((s) => (
            <div key={s.id} className="worker-service-card">
              <div className="ws-head"><h4>{s.name}</h4><span className="ws-cat">{s.category}</span>{s.emergency_available && <span className="emer-tag">Emergency</span>}</div>
              {s.description && <p className="ws-desc">{s.description}</p>}
              <div className="ws-skills">{s.skills.map((sk) => <span key={sk} className="skill-tag">{sk}</span>)}</div>
              <div className="ws-meta">
                <span><IndianRupee size={13} /> {formatPriceRange(s.min_price, s.max_price, s.pricing_type)}</span>
                <span><Briefcase size={13} /> {s.experience_years} yrs</span>
                <span><MapPin size={13} /> {s.service_areas.join(', ') || '—'}</span>
              </div>
              <div className="ws-actions">
                <button className="outline-button sm" onClick={() => { setEditing(s); setShowForm(true); }}><Edit3 size={14} /> Edit</button>
                <button className="outline-button sm danger" onClick={async () => { const { error } = await w.deleteService(s.id); showToast(error ? 'Delete failed' : 'Service removed.'); }}><Trash2 size={14} /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm && <ServiceFormModal existing={editing} onClose={() => setShowForm(false)} onSave={async (data) => {
        if (editing) { const { error } = await w.updateService(editing.id, data); showToast(error ? 'Update failed: ' + error : 'Service updated.'); }
        else { const { error } = await w.addService(data); showToast(error ? 'Add failed: ' + error : 'Service added.'); }
        setShowForm(false);
      }} />}
    </div>
  );
}

function ServiceFormModal({ existing, onClose, onSave }: { existing: WorkerService | null; onClose: () => void; onSave: (d: Omit<WorkerService, 'id' | 'worker_id'>) => Promise<void> }) {
  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? serviceCategories[0]);
  const [skills, setSkills] = useState(existing?.skills.join(', ') ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [exp, setExp] = useState(existing?.experience_years ?? 0);
  const [qualification, setQualification] = useState(existing?.qualification ?? '');
  const [tools, setTools] = useState(existing?.tools ?? '');
  const [areas, setAreas] = useState(existing?.service_areas.join(', ') ?? '');
  const [emergency, setEmergency] = useState(existing?.emergency_available ?? false);
  const [minP, setMinP] = useState(existing?.min_price ?? 0);
  const [maxP, setMaxP] = useState(existing?.max_price ?? 0);
  const [ptype, setPtype] = useState<PricingType>(existing?.pricing_type ?? 'Fixed Price');
  const [err, setErr] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (maxP > 0 && minP > maxP) { setErr('Minimum price cannot exceed maximum price.'); return; }
    void onSave({
      name, category,
      skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
      description, experience_years: Number(exp), qualification, tools,
      service_areas: areas.split(',').map((s) => s.trim()).filter(Boolean),
      emergency_available: emergency, min_price: Number(minP), max_price: Number(maxP), pricing_type: ptype,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>{existing ? 'Edit Service' : 'Add Service'}</h3><button className="modal-close" onClick={onClose}><X size={20} /></button></div>
        <form onSubmit={submit} className="modal-body">
          <div className="form-grid">
            <Field label="Service name" full><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
            <Field label="Category"><select value={category} onChange={(e) => setCategory(e.target.value)}>{serviceCategories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Years of experience"><input type="number" min={0} value={exp} onChange={(e) => setExp(Number(e.target.value))} /></Field>
            <Field label="Skills (comma-separated)" full><input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Wiring, Fault diagnosis" /></Field>
            <Field label="Description" full><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
            <Field label="Qualification"><input value={qualification} onChange={(e) => setQualification(e.target.value)} /></Field>
            <Field label="Tools/equipment"><input value={tools} onChange={(e) => setTools(e.target.value)} /></Field>
            <Field label="Service areas (comma-separated)"><input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Panvel, Vashi" /></Field>
            <Field label="Min price (₹)"><input type="number" min={0} value={minP} onChange={(e) => setMinP(Number(e.target.value))} /></Field>
            <Field label="Max price (₹)"><input type="number" min={0} value={maxP} onChange={(e) => setMaxP(Number(e.target.value))} /></Field>
            <Field label="Pricing type"><select value={ptype} onChange={(e) => setPtype(e.target.value as PricingType)}>{pricingTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Emergency service"><label className="toggle-row"><input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} /> <span>Available for emergency calls</span></label></Field>
          </div>
          {err && <p className="field-error-inline">{err}</p>}
          <div className="modal-footer"><button type="button" className="outline-button" onClick={onClose}>Cancel</button><button type="submit" className="dark-button">{existing ? 'Update' : 'Add'} Service</button></div>
        </form>
      </div>
    </div>
  );
}

function BookingsSection({ w, showToast, onMessage }: { w: W; showToast: (m: string) => void; onMessage: (bookingId: string) => void }) {
  const [filter, setFilter] = useState<WorkerBookingStatus | 'All'>('All');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return w.bookings.filter((b) => {
      const mf = filter === 'All' || b.booking_status === filter;
      const ms = !q || b.service_name.toLowerCase().includes(q) || b.customer_name.toLowerCase().includes(q) || b.booking_reference.toLowerCase().includes(q);
      return mf && ms;
    });
  }, [w.bookings, filter, search]);

  const canTransition = (from: WorkerBookingStatus, to: WorkerBookingStatus): boolean => {
    const transitions: Record<WorkerBookingStatus, WorkerBookingStatus[]> = {
      Pending: ['Confirmed', 'Cancelled'],
      Confirmed: ['In Progress', 'Cancelled'],
      'In Progress': ['Completed'],
      Completed: [],
      Cancelled: [],
    };
    return transitions[from]?.includes(to) ?? false;
  };

  return (
    <div className="worker-bookings">
      <div className="worker-controls">
        <label className="bookings-search"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search bookings..." />{search && <button onClick={() => setSearch('')}><X size={14} /></button>}</label>
      </div>
      <div className="booking-tabs-row">
        {bookingTabs.map((t) => <button key={t} className={`filter-pill ${filter === t ? 'active' : ''}`} onClick={() => setFilter(t)}>{t}</button>)}
      </div>
      {filtered.length === 0 ? <div className="findpros-empty"><CalendarDays size={28} /><h3>No bookings found</h3><p>No bookings match your filter.</p></div> : (
        <div className="worker-booking-grid">
          {filtered.map((b) => (
            <div key={b.id} className="worker-booking-card">
              <div className="wb-top"><strong>{b.service_name}</strong><span className={`booking-status-badge ${b.booking_status.toLowerCase().replace(/ /g, '-')}`}>{b.booking_status}</span></div>
              <div className="wb-meta">
                <div><span>Booking ID</span><strong>{b.booking_reference}</strong></div>
                <div><span>Customer</span><strong>{b.customer_name}</strong></div>
                <div><span>Appointment</span><strong>{new Date(b.appointment_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })}</strong></div>
                <div><span>Location</span><strong>{b.location_area}</strong></div>
                <div><span>Price</span><strong>{formatPrice(b.price)} ({b.payment_status})</strong></div>
              </div>
              {b.customer_note && <p className="wb-note">“{b.customer_note}”</p>}
              <div className="wb-actions">
                <button className="outline-button sm" type="button" onClick={() => onMessage(b.id)}><MessageCircle size={14} /> Message</button>
                {canTransition(b.booking_status, 'Confirmed') && <button className="dark-button sm" onClick={async () => { await w.updateBookingStatus(b.id, 'Confirmed'); showToast('Booking accepted.'); }}>Accept</button>}
                {canTransition(b.booking_status, 'Cancelled') && <button className="outline-button sm danger" onClick={async () => { await w.updateBookingStatus(b.id, 'Cancelled'); showToast('Booking rejected.'); }}>Reject</button>}
                {canTransition(b.booking_status, 'In Progress') && <button className="dark-button sm" onClick={async () => { await w.updateBookingStatus(b.id, 'In Progress'); showToast('Job started.'); }}>Start Job</button>}
                {canTransition(b.booking_status, 'Completed') && <button className="dark-button sm" onClick={async () => { await w.updateBookingStatus(b.id, 'Completed'); showToast('Job marked complete.'); }}>Mark Completed</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsSection({ w }: { w: W }) {
  if (w.reviews.length === 0) return <div className="findpros-empty"><Star size={28} /><h3>No reviews yet</h3><p>Reviews from completed bookings will appear here.</p></div>;
  return (
    <div className="worker-reviews">
      <div className="reviews-summary">
        <div className="reviews-avg"><strong>{w.profile.average_rating.toFixed(1)}</strong><div className="mini-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={18} fill={i < Math.round(w.profile.average_rating) ? 'currentColor' : 'none'} />)}</div><span>{w.profile.total_reviews} reviews</span></div>
      </div>
      <div className="review-list">
        {w.reviews.map((r) => (
          <div key={r.id} className="review-card">
            <div className="review-top"><div className="review-avatar">{r.customer_name[0]}</div><div><strong>{r.customer_name}</strong><p>{r.service_name} • {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p></div><span className="mini-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />)}</span></div>
            <p className="review-comment">“{r.comment}”</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkerMessagesSection({ userId, initialBookingId }: { userId: string; initialBookingId: string | null }) {
  type Conv = { id: string; bookingId?: number; professional_name: string; service_name: string; booking_status: string; last_message: string | null; booking_reference?: string };
  type Msg = { id: string | number; sender: string; content: string; created_at: string };
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [selected, setSelected] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const greetingAttempted = useRef<Set<string>>(new Set());
  const api = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
  const token = () => {
    try {
      const a = JSON.parse(localStorage.getItem('homeserve.auth.user') || '{}');
      return a.token || a.accessToken || a.access_token || '';
    } catch { return ''; }
  };
  const messageUrl = (conversation: Conv) => conversation.id.startsWith('direct-')
    ? `${api}/api/messages/direct/conversations/${conversation.id.slice('direct-'.length)}`
    : `${api}/api/messages/bookings/${conversation.bookingId}`;

  const loadConversations = async (silent = false) => {
    const t = token();
    if (!t) { setError('Please sign in again.'); setLoading(false); return; }
    try {
      const headers = { Authorization: `Bearer ${t}`, Accept: 'application/json' };
      const [bookingResponse, directResponse] = await Promise.all([
        fetch(`${api}/api/messages/conversations/worker/${encodeURIComponent(userId)}`, { headers }),
        fetch(`${api}/api/messages/direct/conversations/worker/${encodeURIComponent(userId)}`, { headers }),
      ]);
      const bookingData = await bookingResponse.json().catch(() => []);
      const directData = await directResponse.json().catch(() => []);
      if (!bookingResponse.ok) throw new Error(bookingData?.message || `Messages request failed (HTTP ${bookingResponse.status}).`);
      if (!directResponse.ok) throw new Error(directData?.message || `Direct messages request failed (HTTP ${directResponse.status}).`);
      const bookings: Conv[] = Array.isArray(bookingData) ? bookingData.map((c: any) => ({
        id: String(c.id), bookingId: Number(c.bookingId), booking_reference: String(c.booking_reference || `HS-${c.bookingId}`),
        professional_name: String(c.professional_name || 'Customer'), service_name: String(c.service_name || 'Home service'),
        booking_status: String(c.booking_status || 'Pending'), last_message: c.last_message ?? null,
      })) : [];
      const direct: Conv[] = Array.isArray(directData) ? directData.map((c: any) => ({
        id: String(c.id), professional_name: String(c.professional_name || 'Customer'),
        service_name: 'Direct message', booking_status: 'Direct', last_message: c.last_message ?? null,
      })) : [];
      setConversations([...direct, ...bookings]);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load messages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadConversations();
    let inFlight = false;
    const refresh = () => {
      if (document.visibilityState !== 'visible' || inFlight) return;
      inFlight = true;
      void loadConversations(true).finally(() => { inFlight = false; });
    };
    const timer = window.setInterval(refresh, 4000);
    const onVisible = () => refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [userId]);

  useEffect(() => {
    if (!initialBookingId || loading) return;
    const target = conversations.find((c) => c.id === `booking-${initialBookingId}` || c.bookingId === Number(initialBookingId));
    if (target) setSelected(target);
  }, [initialBookingId, loading, conversations]);

  useEffect(() => {
    if (!selected) return;
    let active = true;
    let inFlight = false;
    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const r = await fetch(messageUrl(selected), { headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' } });
        const d = await r.json().catch(() => []);
        if (!r.ok) throw new Error(d?.message || `Could not load chat (HTTP ${r.status}).`);
        let rows: Msg[] = Array.isArray(d) ? d : [];
        if (initialBookingId && selected.id === `booking-${initialBookingId}` && rows.length === 0 && !greetingAttempted.current.has(selected.id)) {
          greetingAttempted.current.add(selected.id);
          const greetingResponse = await fetch(messageUrl(selected), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, Accept: 'application/json' },
            body: JSON.stringify({ content: 'Hi' }),
          });
          if (!greetingResponse.ok) {
            const errorBody = await greetingResponse.json().catch(() => ({}));
            throw new Error(errorBody?.message || 'Could not send the opening message.');
          }
          const refreshed = await fetch(messageUrl(selected), { headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' } });
          const refreshedRows = await refreshed.json().catch(() => []);
          if (refreshed.ok) rows = Array.isArray(refreshedRows) ? refreshedRows : [];
          void loadConversations(true);
        }
        if (active) setMessages(rows);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load chat.');
      } finally { inFlight = false; }
    };
    void load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 4000);
    const onVisible = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, [selected?.id, initialBookingId]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content || !selected || sending) return;
    setSending(true);
    try {
      const r = await fetch(messageUrl(selected), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, Accept: 'application/json' },
        body: JSON.stringify({ content }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.message || `Could not send message (HTTP ${r.status}).`);
      setInput('');
      const mr = await fetch(messageUrl(selected), { headers: { Authorization: `Bearer ${token()}`, Accept: 'application/json' } });
      const md = await mr.json().catch(() => []);
      if (mr.ok) setMessages(Array.isArray(md) ? md : []);
      await loadConversations(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send message.');
    } finally { setSending(false); }
  };

  const visibleConversations = conversations
    .filter((c) => Boolean(c.last_message && c.last_message.trim()))
    .filter((c) => !search.trim() || `${c.professional_name} ${c.service_name} ${c.last_message || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="messages-page worker-messages-page">
      <div className="messages-header">
        <div><span className="eyebrow">Worker inbox</span><h1>Messages</h1><p className="messages-subtitle">Chat with customers about their HomeServe bookings.</p></div>
      </div>
      {error && <div className="messages-error">{error}</div>}
      <div className="messages-layout">
        <section className="messages-list-column">
          <div className="messages-search-wrap">
            <label className="messages-search"><Search size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." /></label>
          </div>
          <div className="conversation-list">
            {loading ? <div className="messages-empty-list">Loading conversations...</div> :
              visibleConversations.length === 0 ? <div className="messages-empty-list"><MessageCircle size={28} /><p>No messages yet. Open a booking and select Message to start a chat.</p></div> :
              visibleConversations.map((c) => (
                <button key={c.id} className={`conversation-item ${selected?.id === c.id ? 'selected' : ''}`} onClick={() => setSelected(c)}>
                  <span className="conv-avatar-fallback">{c.professional_name.charAt(0).toUpperCase()}</span>
                  <span className="conv-body">
                    <span className="conv-top-row"><strong>{c.professional_name}</strong></span>
                    <span className="conv-service">{c.service_name} {c.booking_reference && <span className="conv-ref">{c.booking_reference}</span>}</span>
                    <span className="conv-bottom-row"><span className="conv-preview">{c.last_message}</span></span>
                  </span>
                </button>
              ))
            }
          </div>
        </section>
        <section className="messages-chat-column">
          {selected ? (
            <>
              <div className="chat-header">
                <span className="chat-avatar-fallback">{selected.professional_name.charAt(0).toUpperCase()}</span>
                <div className="chat-header-info"><h3>{selected.professional_name}</h3><p>{selected.service_name} · {selected.booking_reference || 'Direct message'}</p></div>
              </div>
              <div className="chat-messages">
                {messages.length === 0 ? <div className="chat-placeholder"><MessageCircle size={28} /><p>No messages yet.</p></div> :
                  messages.map((m) => (
                    <div key={m.id} className={`message-row ${m.sender === 'professional' ? 'sent' : 'received'}`}>
                      <div className="message-bubble"><p>{m.content}</p><span className="message-time">{new Date(m.created_at).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</span></div>
                    </div>
                  ))
                }
              </div>
              <form className="chat-input-bar" onSubmit={send}>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message..." rows={1} maxLength={2000} disabled={sending} />
                <button className="chat-send" type="submit" disabled={!input.trim() || sending}><Send size={18} /></button>
              </form>
            </>
          ) : <div className="chat-placeholder"><MessageCircle size={40} /><h3>Select a conversation</h3><p>Choose a customer from the list, or open Message from one of your bookings.</p></div>}
        </section>
      </div>
    </div>
  );
}

function PortfolioSection({ w, showToast }: { w: W; showToast: (m: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');
  const [cat, setCat] = useState(serviceCategories[0]);

  const add = async () => {
    if (!title.trim()) return;
    const { error } = await w.addPortfolio({ title: title.trim(), description: desc.trim(), image_url: url.trim() || null, category: cat, completed_date: null });
    showToast(error ? 'Add failed: ' + error : 'Portfolio item added.');
    setTitle(''); setDesc(''); setUrl(''); setShowForm(false);
  };

  return (
    <div className="worker-portfolio">
      <div className="section-top-row">
        <h3>Portfolio</h3>
        <button className="dark-button sm" onClick={() => setShowForm(true)}><Plus size={15} /> Add Work</button>
      </div>
      {showForm && (
        <div className="inline-form">
          <div className="form-grid">
            <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Category"><select value={cat} onChange={(e) => setCat(e.target.value)}>{serviceCategories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Image URL" full><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
            <Field label="Description" full><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></Field>
          </div>
          <div className="inline-form-actions"><button className="outline-button sm" onClick={() => setShowForm(false)}>Cancel</button><button className="dark-button sm" onClick={add}>Add</button></div>
        </div>
      )}
      {w.portfolio.length === 0 ? <p className="empty-inline">No portfolio items yet. Show customers your best work.</p> : (
        <div className="portfolio-grid">
          {w.portfolio.map((p) => (
            <div key={p.id} className="portfolio-card">
              {p.image_url && <img src={p.image_url} alt={p.title} />}
              <div className="portfolio-body"><strong>{p.title}</strong><span className="portfolio-cat">{p.category}</span>{p.description && <p>{p.description}</p>}</div>
              <button className="icon-remove" onClick={async () => { const { error } = await w.deletePortfolio(p.id); showToast(error ? 'Delete failed' : 'Portfolio item removed.'); }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PublicProfileModal({ profile, services, reviews, portfolio, onClose }: { profile: WorkerProfile; services: WorkerService[]; reviews: ReturnType<typeof useWorker>['reviews']; portfolio: WorkerPortfolioItem[]; onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header"><h3>Public Profile Preview</h3><button className="modal-close" onClick={onClose}><X size={20} /></button></div>
        <div className="modal-body">
          <div className="pub-profile-header">
            {profile.avatar ? <img src={profile.avatar} alt={profile.full_name} /> : <span className="plc-avatar-fallback large">{profile.full_name[0] ?? 'W'}</span>}
            <div>
              <div className="plc-name-row"><h3>{profile.full_name}</h3>{profile.verification_status === 'Verified' && <span className="verified-tag"><BadgeCheck size={18} /></span>}</div>
              <p>{profile.headline}</p>
              <div className="profile-stats">
                <span><Star size={14} fill="currentColor" /> {profile.average_rating.toFixed(1)} ({profile.total_reviews})</span>
                <span><Briefcase size={13} /> {profile.experience_years} yrs</span>
                <span><MapPin size={13} /> {profile.preferred_areas.join(', ') || '—'}</span>
                <span className={`avail-badge ${profile.availability_status.toLowerCase()}`}><Clock size={11} /> {profile.availability_status}</span>
              </div>
            </div>
          </div>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <h4 className="profile-section-title">Services</h4>
          <div className="profile-services">
            {services.map((s) => (
              <div key={s.id} className="profile-service-row"><div><strong>{s.name}</strong><p className="ws-desc">{s.description}</p></div><span className="profile-service-price">{formatPriceRange(s.min_price, s.max_price, s.pricing_type)}</span></div>
            ))}
          </div>
          <h4 className="profile-section-title">Price Range</h4>
          <p>{formatPriceRange(profile.min_price, profile.max_price, profile.pricing_type)}{profile.negotiable && ' (Negotiable)'}</p>
          {portfolio.length > 0 && (<><h4 className="profile-section-title">Portfolio</h4><div className="portfolio-grid">{portfolio.map((p) => <div key={p.id} className="portfolio-card"><img src={p.image_url ?? ''} alt={p.title} /><div className="portfolio-body"><strong>{p.title}</strong></div></div>)}</div></>)}
          <h4 className="profile-section-title">Reviews</h4>
          {reviews.length === 0 ? <p className="empty-inline">No reviews yet.</p> : (
            <div className="review-list">{reviews.slice(0, 3).map((r) => <div key={r.id} className="review-card"><div className="review-top"><div className="review-avatar">{r.customer_name[0]}</div><div><strong>{r.customer_name}</strong><p>{r.service_name}</p></div><span className="mini-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} />)}</span></div><p className="review-comment">“{r.comment}”</p></div>)}</div>
          )}
        </div>
        <div className="modal-footer"><button className="dark-button">Book Now</button></div>
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return <label className={`modal-field ${full ? 'full' : ''}`}>{label}{children}</label>;
}

function calcAge(dob: string): number {
  const d = new Date(dob);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 86400000));
}
