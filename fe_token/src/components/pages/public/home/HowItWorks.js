import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import { STEPS } from './homeData';

const HowItWorks = ({ isLoggedIn }) => (
  <section className="hp-section" aria-labelledby="hp-steps-title">
    <div className="hp-container">
      <Reveal className="hp-head">
        <h2 id="hp-steps-title" className="hp-title">Easy Registration in 4 Steps</h2>
        <p>From sign-up to meeting the family, in simple steps.</p>
      </Reveal>
      <ol className="hp-steps">
        {STEPS.map((s, i) => (
          <Reveal as="li" key={s.title} delay={i * 100} className="hp-card hp-step">
            <span className="hp-step__num" aria-hidden="true">{i + 1}</span>
            <i className={`fas ${s.icon} hp-step__icon`} aria-hidden="true" />
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </Reveal>
        ))}
      </ol>
      <div className="hp-center">
        <Link to={isLoggedIn ? '/dashboard' : '/signup'} className="hp-btn hp-btn--primary">
          {isLoggedIn ? 'Go to Dashboard' : 'Register Free'}
        </Link>
      </div>
    </div>
  </section>
);

export default HowItWorks;
