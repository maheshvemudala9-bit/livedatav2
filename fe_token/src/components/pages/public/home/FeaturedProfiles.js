import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import { SAMPLE_PROFILES } from './homeData';
import { getFeaturedProfiles } from '../../../../services/userService';
import { imageUrl } from '../../../../utils/imageUrl';
import { placeholderFor } from '../../../../utils/placeholders';

const ALL_TABS = [
  { key: 'brides', label: 'Brides', word: 'Bride' },
  { key: 'grooms', label: 'Grooms', word: 'Groom' },
];

const SKELETON_COUNT = 4;

const FeaturedProfiles = ({ isLoggedIn }) => {
  // Logged-in members only see the opposite gender (Brides for male viewers).
  const myGender = String(localStorage.getItem('userGender') || '').trim().toLowerCase();
  const onlyKey = isLoggedIn ? (myGender === 'male' ? 'brides' : myGender === 'female' ? 'grooms' : null) : null;
  const TABS = onlyKey ? ALL_TABS.filter((t) => t.key === onlyKey) : ALL_TABS;

  const [tab, setTab] = useState(TABS[0].key);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [data, setData] = useState({ brides: [], grooms: [] });
  const tabRefs = useRef({});
  const current = TABS.find((t) => t.key === tab) || TABS[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFeaturedProfiles()
      .then((res) => {
        if (cancelled) return;
        const d = res && res.data && res.data.status === 'Success' ? res.data.data : null;
        if (!d) { setFailed(true); return; }
        setData({
          brides: Array.isArray(d.brides) ? d.brides : [],
          grooms: Array.isArray(d.grooms) ? d.grooms : [],
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isLoggedIn]);

  // Real profiles when available; otherwise (error / both lists empty / this
  // tab empty) the labelled sample cards.
  const bothEmpty = data.brides.length === 0 && data.grooms.length === 0;
  const real = !failed && !bothEmpty ? data[current.key] : [];
  const showReal = real.length > 0;

  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.key === tab);
    let next = null;
    if (e.key === 'ArrowRight') next = TABS[(i + 1) % TABS.length];
    else if (e.key === 'ArrowLeft') next = TABS[(i - 1 + TABS.length) % TABS.length];
    else if (e.key === 'Home') next = TABS[0];
    else if (e.key === 'End') next = TABS[TABS.length - 1];
    if (next) {
      e.preventDefault();
      setTab(next.key);
      const el = tabRefs.current[next.key];
      if (el) el.focus();
    }
  };

  const subtitle = !loading && showReal
    ? 'Handpicked verified profiles from our community'
    : 'Sample profiles — register to see real verified matches';

  return (
    <section className="hp-section hp-section--ivory" aria-labelledby="hp-featured-title">
      <div className="hp-container">
        <Reveal className="hp-head">
          <h2 id="hp-featured-title" className="hp-title">Featured Brides &amp; Grooms</h2>
          <p>{subtitle}</p>
        </Reveal>

        {TABS.length > 1 && (
          <div className="hp-tabs" role="tablist" aria-label="Profile type" onKeyDown={onKeyDown}>
            {TABS.map((t) => (
              <button
                key={t.key}
                ref={(el) => { tabRefs.current[t.key] = el; }}
                type="button"
                role="tab"
                id={`hp-tab-${t.key}`}
                aria-selected={tab === t.key}
                aria-controls={`hp-panel-${t.key}`}
                tabIndex={tab === t.key ? 0 : -1}
                className={`hp-tab ${tab === t.key ? 'is-active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div
          role={TABS.length > 1 ? 'tabpanel' : undefined}
          id={`hp-panel-${current.key}`}
          aria-labelledby={TABS.length > 1 ? `hp-tab-${current.key}` : 'hp-featured-title'}
          aria-busy={loading}
          className="hp-grid hp-grid--4"
        >
          {loading && Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <div key={`sk-${i}`} className="hp-card hp-sample hp-skel" aria-hidden="true">
              <div className="hp-skel__circle" />
              <div className="hp-skel__line" />
              <div className="hp-skel__line hp-skel__line--short" />
              <div className="hp-skel__btn" />
            </div>
          ))}

          {!loading && showReal && real.map((p, i) => {
            const label = [p.name, p.age].filter(Boolean).join(', ') || current.word;
            // Gender: from the profile when present, else from the Brides/Grooms tab.
            const gender = p.gender || current.word;
            const src = imageUrl(p.photo) || placeholderFor(gender);
            return (
              <Reveal key={`${current.key}-${p.uid}`} delay={i * 80} className="hp-card hp-sample">
                <span className="hp-pill hp-pill--featured">Featured</span>
                <img className="hp-photo" src={src} alt={label} data-gender={gender} loading="lazy" width="96" height="96" />
                <h3>{label}</h3>
                {(p.job || p.location) && (
                  <p className="hp-sample__job">{[p.job, p.location].filter(Boolean).join(' · ')}</p>
                )}
                {p.education && <p className="hp-chips"><span>{p.education}</span></p>}
                <p className="hp-sample__id">{p.matId}</p>
                {isLoggedIn ? (
                  <Link to={`/profiledetails/${p.uid}`} className="hp-sample__lock hp-sample__lock--view">
                    <i className="fas fa-user" aria-hidden="true" />
                    View Profile
                  </Link>
                ) : (
                  <Link to="/signup" className="hp-sample__lock">
                    <i className="fas fa-lock" aria-hidden="true" />
                    Register to view full profile
                  </Link>
                )}
              </Reveal>
            );
          })}

          {!loading && !showReal && SAMPLE_PROFILES[current.key].map((p, i) => (
            <Reveal key={`${current.key}-sample-${i}`} delay={i * 80} className="hp-card hp-sample">
              <span className="hp-pill">Sample</span>
              <div className="hp-avatar" aria-hidden="true"><i className="fas fa-user" /></div>
              <h3>{current.word}, {p.age}</h3>
              <p className="hp-sample__job">{p.job} · {p.city}</p>
              <p className="hp-chips"><span>{p.edu}</span><span>Telugu family</span></p>
              <Link to={isLoggedIn ? '/profiles' : '/signup'} className="hp-sample__lock">
                <i className="fas fa-lock" aria-hidden="true" />
                {isLoggedIn ? 'View real matches' : 'Register to view full profile'}
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProfiles;
