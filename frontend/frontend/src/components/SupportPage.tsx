import { useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Mail,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import './support-page.css';

type SupportTopic = 'Booking and service' | 'Payments' | 'Professional' | 'Account and profile' | 'Other';

const topics: SupportTopic[] = [
  'Booking and service',
  'Payments',
  'Professional',
  'Account and profile',
  'Other',
];

const faqs = [
  {
    question: 'Where can I find my booking details?',
    answer: 'Open Bookings from the dashboard navigation to review your service requests and booking information.',
  },
  {
    question: 'How can I contact a service professional?',
    answer: 'Open Messages from your dashboard to view conversations. Messaging may depend on the services connected to your account.',
  },
  {
    question: 'How do I update my contact information?',
    answer: 'Open Profile from the sidebar and choose Edit Profile to update the details shown on your account.',
  },
  {
    question: 'Where do I manage notifications?',
    answer: 'Use the bell icon in the top bar to open Notifications. Notification preferences are available from that page when connected.',
  },
];

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<SupportTopic>('Booking and service');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please complete your name, email, and message.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    // Demo only: this form is not connected to a support API yet.
    setError('');
    setSubmitted(true);
  }

  function resetForm() {
    setName('');
    setEmail('');
    setTopic('Booking and service');
    setMessage('');
    setSubmitted(false);
    setError('');
  }

  return (
    <section className="support-page">
      <div className="support-hero">
        <div className="support-hero-copy">
          <span className="support-eyebrow">HOMESERVE CUSTOMER CARE</span>
          <h1>How can we help?</h1>
          <p>Find answers to common questions or send our team a support request.</p>
          <div className="support-hero-pills">
            <span><ShieldCheck size={15} /> Helpful guidance</span>
            <span><MessageCircle size={15} /> Simple support requests</span>
          </div>
        </div>
        <div className="support-hero-art" aria-hidden="true">
          <div className="support-art-circle"><MessageCircle size={38} /></div>
          <span className="support-art-spark support-art-spark-one">✦</span>
          <span className="support-art-spark support-art-spark-two">✧</span>
        </div>
      </div>

      <div className="support-contact-grid">
        <article className="support-contact-card">
          <span className="support-contact-icon"><MessageCircle size={21} /></span>
          <div><h2>Send a request</h2><p>Tell us what you need help with.</p></div>
          <ArrowRight size={17} className="support-contact-arrow" />
        </article>
        <article className="support-contact-card">
          <span className="support-contact-icon"><CircleHelp size={21} /></span>
          <div><h2>Help centre</h2><p>Browse answers to common questions.</p></div>
          <ArrowRight size={17} className="support-contact-arrow" />
        </article>
        <article className="support-contact-card">
          <span className="support-contact-icon"><Clock3 size={21} /></span>
          <div><h2>Support hours</h2><p>Send a request any time.</p></div>
          <ArrowRight size={17} className="support-contact-arrow" />
        </article>
      </div>

      <div className="support-main-grid">
        <div className="support-form-card">
          <div className="support-section-heading">
            <span className="support-section-icon"><Send size={19} /></span>
            <div><h2>Contact support</h2><p>Fill in the details below and describe the issue.</p></div>
          </div>

          {submitted ? (
            <div className="support-submitted" role="status">
              <span className="support-success-icon"><CheckCircle2 size={29} /></span>
              <h3>Request details ready</h3>
              <p>Your message has been validated in this demo. It has not been sent to a support team because the support API is not connected yet.</p>
              <div className="support-submitted-summary"><strong>Topic</strong><span>{topic}</span><strong>Contact email</strong><span>{email}</span></div>
              <button type="button" className="support-primary-button" onClick={resetForm}>Create another request</button>
            </div>
          ) : (
            <form className="support-form" onSubmit={handleSubmit} noValidate>
              <div className="support-form-row">
                <label className="support-field"><span>Full name <b>*</b></span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your name" autoComplete="name" required /></label>
                <label className="support-field"><span>Email address <b>*</b></span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
              </div>
              <label className="support-field"><span>What do you need help with? <b>*</b></span><select value={topic} onChange={(event) => setTopic(event.target.value as SupportTopic)}>{topics.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
              <label className="support-field"><span>Describe your issue <b>*</b></span><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us a little about what happened and how we can help..." rows={5} maxLength={1500} required /><small>{message.length}/1500 characters</small></label>
              {error && <p className="support-error" role="alert">{error}</p>}
              <div className="support-form-bottom"><p><ShieldCheck size={15} /> Please don't include passwords or payment card details.</p><button type="submit" className="support-primary-button">Submit request <ArrowRight size={16} /></button></div>
            </form>
          )}
        </div>

        <aside className="support-faq-card">
          <div className="support-section-heading">
            <span className="support-section-icon"><CircleHelp size={19} /></span>
            <div><h2>Frequently asked questions</h2><p>Quick answers to help you get started.</p></div>
          </div>
          <div className="support-faq-list">
            {faqs.map((faq, index) => (
              <div className={`support-faq-item ${openFaq === index ? 'is-open' : ''}`} key={faq.question}>
                <button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{faq.question}</span><span className="support-faq-toggle">{openFaq === index ? '−' : '+'}</span></button>
                {openFaq === index && <p>{faq.answer}</p>}
              </div>
            ))}
          </div>
          <div className="support-safety-note"><Wrench size={18} /><p><strong>Need help with a home service?</strong><br />Keep your booking details handy so you can explain the issue clearly.</p></div>
          <div className="support-other-contact"><Mail size={16} /><span>Support contact details can be added here when your team email is ready.</span></div>
        </aside>
      </div>

      <p className="support-demo-note"><Phone size={14} /> This support page is currently a front-end demo. Requests are not sent or stored until a backend support endpoint is connected.</p>
    </section>
  );
}
