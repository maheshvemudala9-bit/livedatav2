import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import logoIcon from '../../../../assets/images/logo/logo-icon.png';

// Welcome announcement for visitors (not logged in).
// Opens ~1s after the Home page loads; shown once per browser session
// (closing it hides it until the visitor opens the site again in a new session).
const SESSION_KEY = 'ts_welcome_seen';
const OPEN_DELAY_MS = 1000;

const SUB_CASTES = [
  { te: 'Kammari', en: 'Blacksmiths', icon: 'fa-hammer' },
  { te: 'Kamsali', en: 'Goldsmiths', icon: 'fa-ring' },
  { te: 'Kanchari', en: 'Brassmiths', icon: 'fa-bell' },
  { te: 'Vadrangi', en: 'Carpenters', icon: 'fa-tools' },
  { te: 'Shilpi', en: 'Sculptors', icon: 'fa-monument' },
];

const seenThisSession = () => {
  try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
};

const WelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const lastFocus = useRef(null);

  // Open after a short delay (once per session)
  useEffect(() => {
    if (seenThisSession()) return undefined;
    const t = setTimeout(() => {
      lastFocus.current = document.activeElement;
      setOpen(true);
    }, OPEN_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    if (lastFocus.current && lastFocus.current.focus) lastFocus.current.focus();
  }, []);

  // While open: lock page scroll, focus the dialog, Esc closes, Tab stays inside
  useEffect(() => {
    if (!open) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (closeBtnRef.current) closeBtnRef.current.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const items = dialogRef.current.querySelectorAll('a[href], button:not([disabled])');
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  return (
    <div className="hp-modal" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div
        ref={dialogRef}
        className="hp-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hp-welcome-title"
        aria-describedby="hp-welcome-desc"
      >
        <button
          ref={closeBtnRef}
          type="button"
          className="hp-modal__close"
          onClick={close}
          aria-label="Close welcome message"
        >
          <i className="fas fa-times" aria-hidden="true" />
        </button>

        <div className="hp-modal__head">
          <img src={logoIcon} alt="" width="64" height="64" className="hp-modal__logo" />
          <p className="hp-modal__eyebrow">Welcome to</p>
          <h2 id="hp-welcome-title" className="hp-modal__title">Telugu Sambandham Matrimony</h2>
          <p className="hp-modal__tag">A community-based matrimony for Viswabrahmins</p>
        </div>

        <div className="hp-modal__body">
          <p id="hp-welcome-desc" className="hp-modal__lead">
            We warmly welcome Viswabrahmin families from all <strong>five sub-castes</strong>:
          </p>
          <ul className="hp-modal__castes">
            {SUB_CASTES.map((c) => (
              <li key={c.te}>
                <span className="hp-modal__icon" aria-hidden="true"><i className={`fas ${c.icon}`} /></span>
                <span className="hp-modal__caste">
                  <strong>{c.te}</strong>
                  <span>{c.en}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="hp-modal__offer"><i className="fas fa-gift" aria-hidden="true" /> Free registration – Limited Launch Offer</p>
        </div>

        <div className="hp-modal__actions">
          <Link to="/signup" className="hp-btn hp-btn--primary" onClick={close}>Register Free</Link>
          <button type="button" className="hp-btn hp-btn--outline" onClick={close}>Explore the site</button>
        </div>
        <p className="hp-modal__login">Already a member? <Link to="/login" onClick={close}>Login</Link></p>
      </div>
    </div>
  );
};

export default WelcomeModal;
