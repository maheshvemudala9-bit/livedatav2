import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import { PLANS, PLAN_COMMON } from './homeData';

const MembershipPlans = ({ isLoggedIn }) => (
  <section className="hp-section hp-section--ivory" aria-labelledby="hp-plans-title">
    <div className="hp-container">
      <Reveal className="hp-head">
        <h2 id="hp-plans-title" className="hp-title">Membership Plans</h2>
        <p>All plans are free during our Limited Launch Offer.</p>
      </Reveal>
      <div className="hp-grid hp-grid--3 hp-plans">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 100} className={`hp-card hp-plan ${p.ribbon ? 'hp-plan--top' : ''}`}>
            {p.ribbon && <span className="hp-plan__ribbon">{p.ribbon}</span>}
            <i className={`fas ${p.icon} hp-plan__icon`} aria-hidden="true" />
            <h3>{p.name}</h3>
            <span className="hp-badge">Free – Limited Launch Offer</span>
            <ul className="hp-checks">
              <li>{p.access}</li>
              {PLAN_COMMON.map((c) => <li key={c}>{c}</li>)}
            </ul>
            <Link to={isLoggedIn ? '/dashboard' : '/signup'} className="hp-btn hp-btn--primary hp-btn--block">
              Get Started Free
            </Link>
          </Reveal>
        ))}
      </div>
      <p className="hp-small">To upgrade your plan, contact <Link to="/contact-us">Help &amp; Support</Link>.</p>
    </div>
  </section>
);

export default MembershipPlans;
