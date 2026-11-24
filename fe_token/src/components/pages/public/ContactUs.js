import React, { useContext, useEffect, useState } from 'react';
import Profiles from '../../templates/ImagesLoader';
import { AuthContext } from '../../hooks/AuthContext';
import { useToast } from '../../hooks/ToastContext';
import { getUserById, submitContactQuery } from '../../../services/userService';
import '../../../assets/css/pages/contact-us.css';

const SUPPORT_EMAIL = 'support@telugusambandham.com';

const SUBJECTS = [
  'Registration / Profile Help',
  'Membership / Payment',
  'Report a Profile',
  'Technical Issue',
  'Feedback / Suggestion',
  'Other',
];

const EMPTY = { name: '', email: '', phone: '', subject: '', message: '', website: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]+$/;

const validate = (f) => {
  const errors = {};
  const name = f.name.trim();
  const email = f.email.trim();
  const phone = f.phone.trim();
  const message = f.message.trim();

  if (!name) errors.name = 'Name is required.';
  else if (name.length < 2 || name.length > 100) errors.name = 'Name must be 2 to 100 characters.';

  if (!email) errors.email = 'Email is required.';
  else if (email.length > 255 || !EMAIL_RE.test(email)) errors.email = 'Please enter a valid email address.';

  const digits = phone.replace(/[\s+-]/g, '');
  if (!phone) errors.phone = 'Phone / WhatsApp number is required.';
  else if (!PHONE_RE.test(phone) || phone.lastIndexOf('+') > 0 || digits.length < 10 || digits.length > 15) {
    errors.phone = 'Enter a valid number (10 to 15 digits, optional leading +).';
  }

  if (!SUBJECTS.includes(f.subject)) errors.subject = 'Please select a subject.';

  if (!message) errors.message = 'Message is required.';
  else if (message.length < 10) errors.message = 'Message must be at least 10 characters.';
  else if (message.length > 2000) errors.message = 'Message must be at most 2000 characters.';

  return errors;
};

const ContactUs = () => {
  const { isLoggedIn } = useContext(AuthContext);
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // Logged-in users: prefill name / email / phone (fields stay editable).
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!isLoggedIn || !userId) return undefined;
    let cancelled = false;
    getUserById(userId)
      .then(({ data }) => {
        const u = Array.isArray(data) ? data[0] : null;
        if (cancelled || !u) return;
        const fullName = [u.ufname, u.ulname].filter(Boolean).join(' ');
        setForm((prev) => ({
          ...prev,
          name: prev.name || fullName || '',
          email: prev.email || u.uemail || '',
          phone: prev.phone || u.uphone || '',
        }));
      })
      .catch(() => { /* prefill is optional */ });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (sent) setSent(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSending(true);
    try {
      const { data } = await submitContactQuery({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        subject: form.subject,
        message: form.message.trim(),
        website: form.website,
      });
      if (data.status === 'Success') {
        showToast({
          title: 'Query sent',
          description: 'Thank you! We have received your query and will get back to you soon.',
          type: 'success',
        });
        setForm(EMPTY);
        setErrors({});
        setSent(true);
      } else {
        showToast({ title: 'Could not send', description: data.result || 'Please try again.', type: 'error' });
      }
    } catch (err) {
      showToast({
        title: 'Could not send',
        description: err.response?.data?.result || 'Something went wrong. Please try again later.',
        type: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const fieldClass = (n) => `form-control${errors[n] ? ' cu-field--error' : ''}`;

  return (
    <>
      <div
        className="inner-heading"
        style={{ backgroundImage: `url(${Profiles.titlebg})` }}
      >
        <div className="container">
          <h1>Contact Us</h1>
        </div>
      </div>

      <div className="inner-content">
        <div className="container">
          <div className="cu-layout">
            <form className="cu-card" onSubmit={handleSubmit} noValidate>
              <h2 className="cu-title">Send us your query</h2>

              {sent && (
                <div className="cu-success" role="status">
                  Thank you! We have received your query and will get back to you soon.
                </div>
              )}

              <div className="cu-grid">
                <div className="cu-col">
                  <label className="cu-label" htmlFor="cu-name">Name</label>
                  <input id="cu-name" name="name" type="text" className={fieldClass('name')}
                    value={form.name} onChange={handleChange} maxLength={100} autoComplete="name" />
                  {errors.name && <span className="cu-error">{errors.name}</span>}
                </div>

                <div className="cu-col">
                  <label className="cu-label" htmlFor="cu-email">Email</label>
                  <input id="cu-email" name="email" type="email" className={fieldClass('email')}
                    value={form.email} onChange={handleChange} maxLength={255} autoComplete="email" />
                  {errors.email && <span className="cu-error">{errors.email}</span>}
                </div>

                <div className="cu-col">
                  <label className="cu-label" htmlFor="cu-phone">Phone / WhatsApp</label>
                  <input id="cu-phone" name="phone" type="tel" className={fieldClass('phone')}
                    value={form.phone} onChange={handleChange} maxLength={25} autoComplete="tel"
                    placeholder="e.g. 9876543210 or +91 98765 43210" />
                  {errors.phone && <span className="cu-error">{errors.phone}</span>}
                </div>

                <div className="cu-col">
                  <label className="cu-label" htmlFor="cu-subject">Subject</label>
                  <select id="cu-subject" name="subject" className={fieldClass('subject')}
                    value={form.subject} onChange={handleChange}>
                    <option value="">Select a subject</option>
                    {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.subject && <span className="cu-error">{errors.subject}</span>}
                </div>

                <div className="cu-col cu-col--full">
                  <label className="cu-label" htmlFor="cu-message">Message / Query</label>
                  <textarea id="cu-message" name="message" rows={6} className={fieldClass('message')}
                    value={form.message} onChange={handleChange} maxLength={2000} />
                  <span className="cu-count">{form.message.length}/2000</span>
                  {errors.message && <span className="cu-error">{errors.message}</span>}
                </div>

                {/* Honeypot: hidden from people, bots tend to fill it */}
                <div className="cu-hp" aria-hidden="true">
                  <label htmlFor="cu-website">Website</label>
                  <input id="cu-website" name="website" type="text" tabIndex={-1} autoComplete="off"
                    value={form.website} onChange={handleChange} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary cu-submit" disabled={sending}>
                {sending ? 'Sending…' : 'Send Query'}
              </button>
            </form>

            <aside className="cu-card cu-side">
              <h2 className="cu-title">Get in touch</h2>
              <p className="cu-side__text">
                Questions about registration, membership or a profile? Send us a message and we will reply by email.
              </p>
              <ul className="cu-info">
                <li>
                  <i className="far fa-envelope" aria-hidden="true"></i>
                  <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                </li>
                <li>
                  <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                  <span>Kukatpally &amp; Alwal, Hyderabad, Telangana, India</span>
                </li>
              </ul>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactUs;
