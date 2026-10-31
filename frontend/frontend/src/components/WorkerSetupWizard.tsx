import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, BadgeCheck, Briefcase, Check, CheckCircle2,
  Clock, Home, ImagePlus, IndianRupee, MapPin, Plus, Save,
  Trash2, User, Wrench, X,
} from 'lucide-react';
import {
  type PricingType, type QualificationType, type WorkerProfile, type WorkerService,
  type WorkerQualification, type WorkerAvailability,
  formatPrice, formatPriceRange, mumbaiAreas, pricingTypes,
  serviceCategories, weekdays,
} from '@/lib/worker';
import { useWorker } from '@/lib/useWorker';

type Props = {
  userId: string;
  email: string;
  fullName: string;
  onStepChange: (step: number) => Promise<void>;
  onComplete: () => Promise<void>;
  initialStep: number;
};

const stepLabels = ['Personal', 'Professional', 'Services', 'Pricing', 'Availability', 'Portfolio', 'Review'];
const stepIcons = [User, Briefcase, Wrench, IndianRupee, Clock, ImagePlus, CheckCircle2];

export default function WorkerSetupWizard({ userId, email, fullName, onStepChange, onComplete, initialStep }: Props) {
  const w = useWorker(userId, email, fullName);
  const [step, setStep] = useState(initialStep > 0 && initialStep < 7 ? initialStep - 1 : 0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const goToStep = (next: number) => {
    const clamped = Math.max(0, Math.min(6, next));
    setStep(clamped);
    void onStepChange(clamped + 1);
  };

  if (w.loading) return <div className="wizard-loading">Loading your profile...</div>;

  return (
    <div className="wizard-page">
      <div className="wizard-shell">
        <div className="wizard-brand-row">
          <span className="wizard-brand-mark"><Home size={18} /></span>
          <span className="wizard-brand-text">HomeServe Worker Setup</span>
        </div>

        <WizardStepper step={step} />

        <div className="wizard-card">
          <div className="wizard-card-header">
            <span className="wizard-step-icon">{(() => { const Icon = stepIcons[step]; return <Icon size={22} />; })()}</span>
            <div>
              <span className="wizard-step-label">Step {step + 1} of 7</span>
              <h2>{stepLabels[step]}</h2>
            </div>
          </div>

          <div className="wizard-card-body">
            {step === 0 && <StepPersonal w={w} setErrors={setErrors} />}
            {step === 1 && <StepProfessional w={w} />}
            {step === 2 && <StepServices w={w} />}
            {step === 3 && <StepPricing w={w} />}
            {step === 4 && <StepAvailability w={w} />}
            {step === 5 && <StepPortfolio w={w} />}
            {step === 6 && <StepReview w={w} />}
          </div>

          {errors.length > 0 && step === 0 && (
            <div className="wizard-errors">
              {errors.map((e) => <p key={e}><X size={14} /> {e}</p>)}
            </div>
          )}

          <div className="wizard-card-footer">
            <button className="outline-button" onClick={() => goToStep(step - 1)} disabled={step === 0 || saving}>
              <ArrowLeft size={16} /> Back
            </button>
            <div className="wizard-footer-spacer" />
            <button
              className="outline-button"
              disabled={saving}
              onClick={async () => { setSaving(true); await onStepChange(step + 1); setSaving(false); }}
            >
              <Save size={16} /> Save as Draft
            </button>
            {step < 6 ? (
              <button className="dark-button" onClick={() => goToStep(step + 1)}>
                Save & Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="dark-button"
                disabled={saving}
                onClick={async () => { setSaving(true); await onComplete(); setSaving(false); }}
              >
                <CheckCircle2 size={16} /> Submit Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WizardStepper({ step }: { step: number }) {
  return (
    <div className="wizard-stepper">
      {stepLabels.map((label, i) => {
        const Icon = stepIcons[i];
        const status = i < step ? 'done' : i === step ? 'current' : 'todo';
        return (
          <div key={label} className={`wizard-step-item ${status}`}>
            <div className="wizard-step-circle">
              {status === 'done' ? <Check size={16} /> : <Icon size={16} />}
            </div>
            <span className="wizard-step-text">{label}</span>
            {i < stepLabels.length - 1 && <div className={`wizard-step-connector ${i < step ? 'filled' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

type W = ReturnType<typeof useWorker>;
type ErrorsSetter = (e: string[]) => void;

function StepPersonal({ w, setErrors }: { w: W; setErrors: ErrorsSetter }) {
  const [p, setP] = useState<WorkerProfile>(w.profile);
  const [areas, setAreas] = useState(p.preferred_areas.join(', '));

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!p.full_name.trim()) errs.push('Full name is required.');
    if (!p.phone.trim()) errs.push('Phone number is required.');
    if (!p.email.trim()) errs.push('Email is required.');
    if (!p.address.trim()) errs.push('Address is required.');
    if (!p.city.trim()) errs.push('City is required.');
    if (!p.state.trim()) errs.push('State is required.');
    if (!p.pincode.trim()) errs.push('PIN code is required.');
    if (p.pincode && !/^\d{6}$/.test(p.pincode.trim())) errs.push('PIN code must be 6 digits.');
    return errs;
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setErrors(validate()); }, [p]);

  const save = async () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;
    await w.saveProfile({ ...p, preferred_areas: areas.split(',').map((s) => s.trim()).filter(Boolean) });
  };

  return (
    <form className="wizard-form" onSubmit={(e: FormEvent) => { e.preventDefault(); void save(); }}>
      <div className="form-section">
        <h3>Personal Information</h3>
        <p className="wizard-section-hint">Your residential address and date of birth are private — customers cannot see them.</p>
        <div className="form-grid">
          <Field label="Full name" full><input value={p.full_name} onChange={(e) => setP({ ...p, full_name: e.target.value })} required /></Field>
          <Field label="Profile photo URL"><input value={p.avatar ?? ''} onChange={(e) => setP({ ...p, avatar: e.target.value || null })} placeholder="https://..." /></Field>
          <Field label="Date of birth"><input type="date" value={p.date_of_birth ?? ''} onChange={(e) => setP({ ...p, date_of_birth: e.target.value || null })} /></Field>
          <Field label="Age (auto)"><input value={p.date_of_birth ? calcAge(p.date_of_birth) + ' years' : ''} disabled /></Field>
          <Field label="Gender (optional)"><input value={p.gender} onChange={(e) => setP({ ...p, gender: e.target.value })} /></Field>
          <Field label="Phone number"><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} required /></Field>
          <Field label="Email" full><input type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} required /></Field>
          <Field label="Complete address" full><input value={p.address} onChange={(e) => setP({ ...p, address: e.target.value })} required /></Field>
          <Field label="City"><input value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} required /></Field>
          <Field label="State"><input value={p.state} onChange={(e) => setP({ ...p, state: e.target.value })} required /></Field>
          <Field label="PIN code"><input value={p.pincode} onChange={(e) => setP({ ...p, pincode: e.target.value })} required pattern="\d{6}" placeholder="6-digit PIN" /></Field>
          <Field label="Preferred working areas (comma-separated)" full><input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Panvel, Vashi" /></Field>
        </div>
      </div>
      <button type="submit" className="hidden-submit" aria-hidden />
    </form>
  );
}

function StepProfessional({ w }: { w: W }) {
  const [p, setP] = useState<WorkerProfile>(w.profile);
  const [langs, setLangs] = useState(p.languages.join(', '));
  const [quals, setQuals] = useState<WorkerQualification[]>(w.qualifications);
  const [qType, setQType] = useState<QualificationType>('Education');
  const [qTitle, setQTitle] = useState('');
  const [qInst, setQInst] = useState('');
  const [qYear, setQYear] = useState('');
  const [qDesc, setQDesc] = useState('');

  const save = async () => {
    await w.saveProfile({ ...p, languages: langs.split(',').map((s) => s.trim()).filter(Boolean) });
  };

  const addQual = async () => {
    if (!qTitle.trim()) return;
    const { error } = await w.addQualification({
      type: qType, title: qTitle.trim(), institution: qInst.trim(),
      year: qYear ? Number(qYear) : null, description: qDesc.trim(),
    });
    if (!error) {
      setQuals((prev) => [...prev, {
        id: 'local-' + Date.now(), worker_id: w.profile.id,
        type: qType, title: qTitle.trim(), institution: qInst.trim(),
        year: qYear ? Number(qYear) : null, description: qDesc.trim(),
      }]);
      setQTitle(''); setQInst(''); setQYear(''); setQDesc('');
    }
  };

  const removeQual = async (id: string) => {
    await w.deleteQualification(id);
    setQuals((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="wizard-form">
      <div className="form-section">
        <h3>Professional Information</h3>
        <div className="form-grid">
          <Field label="Professional headline" full><input value={p.headline} onChange={(e) => setP({ ...p, headline: e.target.value })} placeholder="e.g. Master Electrician" /></Field>
          <Field label="Short bio" full><textarea value={p.bio} onChange={(e) => setP({ ...p, bio: e.target.value })} rows={3} /></Field>
          <Field label="Years of experience"><input type="number" min={0} value={p.experience_years} onChange={(e) => setP({ ...p, experience_years: Number(e.target.value) })} /></Field>
          <Field label="Languages spoken (comma-separated)"><input value={langs} onChange={(e) => setLangs(e.target.value)} placeholder="Hindi, English" /></Field>
        </div>
      </div>
      <div className="form-section">
        <h3>Qualifications & Certifications</h3>
        <p className="wizard-section-hint">Add your education, training courses, certifications, and licences.</p>
        <div className="qual-list">
          {quals.map((q) => (
            <div key={q.id} className="qual-item">
              <span className="qual-type">{q.type}</span>
              <div className="qual-body">
                <strong>{q.title}</strong>
                {q.institution && <p>{q.institution}{q.year ? ` • ${q.year}` : ''}</p>}
                {q.description && <p className="qual-desc">{q.description}</p>}
              </div>
              <button type="button" className="icon-remove" onClick={() => void removeQual(q.id)}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <div className="inline-form">
          <div className="form-grid">
            <Field label="Type"><select value={qType} onChange={(e) => setQType(e.target.value as QualificationType)}>{['Education','Course','Certificate','Licence','Experience'].map((t) => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Title"><input value={qTitle} onChange={(e) => setQTitle(e.target.value)} /></Field>
            <Field label="Institution"><input value={qInst} onChange={(e) => setQInst(e.target.value)} /></Field>
            <Field label="Year"><input type="number" value={qYear} onChange={(e) => setQYear(e.target.value)} /></Field>
            <Field label="Description" full><input value={qDesc} onChange={(e) => setQDesc(e.target.value)} /></Field>
          </div>
          <div className="inline-form-actions">
            <button type="button" className="dark-button sm" onClick={() => void addQual()}><Plus size={14} /> Add Qualification</button>
          </div>
        </div>
      </div>
      <button type="button" className="hidden-submit" aria-hidden onClick={() => void save()} />
    </div>
  );
}

function StepServices({ w }: { w: W }) {
  const [services, setServices] = useState<WorkerService[]>(w.services);
  const [editing, setEditing] = useState<WorkerService | null>(null);
  const [showForm, setShowForm] = useState(false);

  const refresh = async () => {
    // Re-read from hook state
    setServices(w.services);
  };

  const handleSave = async (data: Omit<WorkerService, 'id' | 'worker_id'>) => {
    if (editing) {
      const { error } = await w.updateService(editing.id, data);
      if (!error) setServices((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...data } : s));
    } else {
      const { error } = await w.addService(data);
      if (!error) setServices((prev) => [...prev, { ...data, id: 'local-' + Date.now(), worker_id: w.profile.id }]);
    }
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    await w.deleteService(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="wizard-form">
      <div className="form-section">
        <div className="section-top-row">
          <h3>Services & Skills</h3>
          <button className="dark-button sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={15} /> Add Service</button>
        </div>
        <p className="wizard-section-hint">Select the services you offer. You can add multiple services.</p>
        {services.length === 0 ? (
          <div className="wizard-empty">
            <Wrench size={32} />
            <p>No services added yet. Add your first service to start receiving bookings.</p>
          </div>
        ) : (
          <div className="worker-service-list">
            {services.map((s) => (
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
                  <button className="outline-button sm" onClick={() => { setEditing(s); setShowForm(true); }}>Edit</button>
                  <button className="outline-button sm danger" onClick={() => void handleDelete(s.id)}><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm && (
        <ServiceFormModal
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
      <button type="button" className="hidden-submit" aria-hidden onClick={() => void refresh()} />
    </div>
  );
}

function ServiceFormModal({ existing, onClose, onSave }: {
  existing: WorkerService | null;
  onClose: () => void;
  onSave: (d: Omit<WorkerService, 'id' | 'worker_id'>) => Promise<void>;
}) {
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

function StepPricing({ w }: { w: W }) {
  const [p, setP] = useState<WorkerProfile>(w.profile);
  const [charges, setCharges] = useState(p.additional_charges);
  const [err, setErr] = useState('');

  const save = async () => {
    if (p.min_price > p.max_price && p.max_price > 0) { setErr('Minimum price cannot exceed maximum price.'); return; }
    setErr('');
    await w.saveProfile({ ...p, additional_charges: charges });
  };

  const preview = formatPriceRange(p.min_price, p.max_price, p.pricing_type);

  return (
    <div className="wizard-form">
      <div className="form-section">
        <h3>Pricing</h3>
        <p className="wizard-section-hint">Set your base pricing. Customers see this on your public profile.</p>
        <div className="form-grid">
          <Field label="Starting price (₹)"><input type="number" min={0} value={p.starting_price} onChange={(e) => setP({ ...p, starting_price: Number(e.target.value) })} /></Field>
          <Field label="Minimum price (₹)"><input type="number" min={0} value={p.min_price} onChange={(e) => setP({ ...p, min_price: Number(e.target.value) })} /></Field>
          <Field label="Maximum price (₹)"><input type="number" min={0} value={p.max_price} onChange={(e) => setP({ ...p, max_price: Number(e.target.value) })} /></Field>
          <Field label="Pricing method"><select value={p.pricing_type} onChange={(e) => setP({ ...p, pricing_type: e.target.value as PricingType })}>{pricingTypes.map((t) => <option key={t}>{t}</option>)}</select></Field>
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
        {err && <p className="field-error-inline">{err}</p>}
        <div className="price-preview">
          <span className="price-preview-label">Price preview</span>
          <span className="price-preview-value">{preview}{p.negotiable && ' (Negotiable)'}</span>
        </div>
      </div>
      <button type="button" className="hidden-submit" aria-hidden onClick={() => void save()} />
    </div>
  );
}

function StepAvailability({ w }: { w: W }) {
  const [a, setA] = useState<WorkerAvailability>(w.availability);

  const toggleDay = (day: string) => setA((prev) => ({ ...prev, working_days: { ...prev.working_days, [day]: { ...prev.working_days[day], enabled: !prev.working_days[day].enabled } } }));
  const setDayTime = (day: string, field: 'start' | 'end', val: string) => setA((prev) => ({ ...prev, working_days: { ...prev.working_days, [day]: { ...prev.working_days[day], [field]: val } } }));

  const save = async () => {
    await w.saveAvailability(a);
  };

  return (
    <div className="wizard-form">
      <div className="form-section">
        <h3>Availability Status</h3>
        <div className="avail-toggles">
          {(['Available', 'Busy', 'Unavailable'] as const).map((s) => (
            <button key={s} className={`avail-toggle ${a.status === s ? 'active' : ''}`} onClick={() => setA({ ...a, status: s })}><Clock size={15} /> {s}</button>
          ))}
        </div>
      </div>
      <div className="form-section">
        <h3>Working Schedule</h3>
        <div className="schedule-grid">
          {weekdays.map((day) => {
            const wd = a.working_days[day] ?? { start: '09:00', end: '18:00', enabled: false };
            return (
              <div key={day} className={`schedule-row ${wd.enabled ? 'enabled' : ''}`}>
                <label className="schedule-day"><input type="checkbox" checked={wd.enabled} onChange={() => toggleDay(day)} /> {day}</label>
                <input type="time" value={wd.start} disabled={!wd.enabled} onChange={(e) => setDayTime(day, 'start', e.target.value)} />
                <span>to</span>
                <input type="time" value={wd.end} disabled={!wd.enabled} onChange={(e) => setDayTime(day, 'end', e.target.value)} />
              </div>
            );
          })}
        </div>
      </div>
      <div className="form-section">
        <h3>Service Area & Emergency</h3>
        <div className="form-grid">
          <Field label="Primary service area"><select value={a.service_area} onChange={(e) => setA({ ...a, service_area: e.target.value })}>{mumbaiAreas.map((ar) => <option key={ar}>{ar}</option>)}</select></Field>
          <Field label="Max travel distance (km)"><input type="number" min={1} value={a.max_travel_distance} onChange={(e) => setA({ ...a, max_travel_distance: Number(e.target.value) })} /></Field>
          <Field label="Break start"><input type="time" value={a.break_start ?? ''} onChange={(e) => setA({ ...a, break_start: e.target.value })} /></Field>
          <Field label="Break end"><input type="time" value={a.break_end ?? ''} onChange={(e) => setA({ ...a, break_end: e.target.value })} /></Field>
          <Field label="Emergency service"><label className="toggle-row"><input type="checkbox" checked={a.emergency_service} onChange={(e) => setA({ ...a, emergency_service: e.target.checked })} /> <span>Available for emergency calls</span></label></Field>
        </div>
      </div>
      <button type="button" className="hidden-submit" aria-hidden onClick={() => void save()} />
    </div>
  );
}

function StepPortfolio({ w }: { w: W }) {
  const [items, setItems] = useState(w.portfolio);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [url, setUrl] = useState('');
  const [cat, setCat] = useState(serviceCategories[0]);

  const add = async () => {
    if (!title.trim()) return;
    const { error } = await w.addPortfolio({ title: title.trim(), description: desc.trim(), image_url: url.trim() || null, category: cat, completed_date: null });
    if (!error) {
      setItems((prev) => [...prev, { id: 'local-' + Date.now(), worker_id: w.profile.id, title: title.trim(), description: desc.trim(), image_url: url.trim() || null, category: cat, completed_date: null }]);
      setTitle(''); setDesc(''); setUrl('');
    }
  };

  const remove = async (id: string) => {
    await w.deletePortfolio(id);
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="wizard-form">
      <div className="form-section">
        <h3>Portfolio & Verification</h3>
        <p className="wizard-section-hint">Show customers your best work. Upload images of previous projects and your verification will be reviewed by our team.</p>
        <div className="verification-status-row">
          <span className={`verify-badge ${w.profile.verification_status.toLowerCase()}`}>
            {w.profile.verification_status === 'Verified' && <BadgeCheck size={14} />}
            Verification: {w.profile.verification_status}
          </span>
          <p className="verification-hint">Your verification will be reviewed by HomeServe. You can access your dashboard while pending.</p>
        </div>
      </div>
      <div className="form-section">
        <h4>Add Portfolio Item</h4>
        <div className="inline-form">
          <div className="form-grid">
            <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Category"><select value={cat} onChange={(e) => setCat(e.target.value)}>{serviceCategories.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field label="Image URL" full><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
            <Field label="Description" full><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></Field>
          </div>
          <div className="inline-form-actions">
            <button type="button" className="dark-button sm" onClick={() => void add()}><Plus size={14} /> Add Work</button>
          </div>
        </div>
        {items.length > 0 && (
          <div className="portfolio-grid">
            {items.map((p) => (
              <div key={p.id} className="portfolio-card">
                {p.image_url && <img src={p.image_url} alt={p.title} />}
                <div className="portfolio-body"><strong>{p.title}</strong><span className="portfolio-cat">{p.category}</span>{p.description && <p>{p.description}</p>}</div>
                <button className="icon-remove" onClick={() => void remove(p.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepReview({ w }: { w: W }) {
  const p = w.profile;
  const completionPct = useMemo(() => {
    const fields: (keyof WorkerProfile)[] = ['full_name', 'headline', 'bio', 'avatar', 'phone', 'email', 'city', 'state', 'pincode', 'preferred_areas', 'languages', 'starting_price'];
    let filled = 0;
    fields.forEach((f) => {
      const v = p[f];
      if (Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && v !== undefined) filled++;
    });
    return Math.round((filled / fields.length) * 100);
  }, [p]);

  return (
    <div className="wizard-review">
      <div className="review-completion">
        <div className="completion-ring large">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#e0e6f0" strokeWidth="6" />
            <circle cx="36" cy="36" r="30" fill="none" stroke="#0b1c30" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(completionPct / 100) * 188.5} 188.5`} transform="rotate(-90 36 36)" />
          </svg>
          <span>{completionPct}%</span>
        </div>
        <div>
          <h3>Profile Completion</h3>
          <p>{completionPct >= 100 ? 'Your profile is complete!' : 'Complete more fields to improve your visibility to customers.'}</p>
        </div>
      </div>

      <div className="review-sections">
        <ReviewSection title="Personal Information" icon={User}>
          <ReviewRow label="Name" value={p.full_name} />
          <ReviewRow label="Phone" value={p.phone} />
          <ReviewRow label="Email" value={p.email} />
          <ReviewRow label="Location" value={`${p.city}, ${p.state} ${p.pincode}`} />
        </ReviewSection>
        <ReviewSection title="Professional" icon={Briefcase}>
          <ReviewRow label="Headline" value={p.headline || 'Not set'} />
          <ReviewRow label="Experience" value={`${p.experience_years} years`} />
          <ReviewRow label="Languages" value={p.languages.join(', ') || 'Not set'} />
          <ReviewRow label="Qualifications" value={`${w.qualifications.length} added`} />
        </ReviewSection>
        <ReviewSection title="Services" icon={Wrench}>
          <ReviewRow label="Services" value={`${w.services.length} added`} />
          {w.services.map((s) => <ReviewRow key={s.id} label={s.category} value={s.name} />)}
        </ReviewSection>
        <ReviewSection title="Pricing" icon={IndianRupee}>
          <ReviewRow label="Price range" value={formatPriceRange(p.min_price, p.max_price, p.pricing_type)} />
          <ReviewRow label="Starting price" value={formatPrice(p.starting_price)} />
          <ReviewRow label="Visit charge" value={p.visit_charge > 0 ? formatPrice(p.visit_charge) : 'Free'} />
          <ReviewRow label="Negotiable" value={p.negotiable ? 'Yes' : 'No'} />
        </ReviewSection>
        <ReviewSection title="Availability" icon={Clock}>
          <ReviewRow label="Status" value={w.availability.status} />
          <ReviewRow label="Service area" value={w.availability.service_area || 'Not set'} />
          <ReviewRow label="Max travel" value={`${w.availability.max_travel_distance} km`} />
          <ReviewRow label="Emergency" value={w.availability.emergency_service ? 'Available' : 'Not available'} />
        </ReviewSection>
        <ReviewSection title="Portfolio" icon={ImagePlus}>
          <ReviewRow label="Items" value={`${w.portfolio.length} added`} />
        </ReviewSection>
      </div>

      <div className="review-submit-hint">
        <CheckCircle2 size={20} />
        <p>By submitting, your profile will be saved and you'll be taken to your Worker Space dashboard. Your verification status will remain pending until reviewed by HomeServe.</p>
      </div>
    </div>
  );
}

function ReviewSection({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="review-section-card">
      <h4><Icon size={17} /> {title}</h4>
      <div className="review-rows">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="review-row">
      <span>{label}</span>
      <strong>{value}</strong>
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
