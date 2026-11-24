import React from 'react';
import Reveal from './Reveal';
import { TRUST_ITEMS } from './homeData';

const TrustStrip = () => (
  <div className="hp-container hp-trust-wrap">
    <Reveal as="ul" className="hp-trust" aria-label="Why members trust us">
      {TRUST_ITEMS.map((t) => (
        <li key={t.title} className="hp-trust__item">
          <i className={`fas ${t.icon}`} aria-hidden="true" />
          <div>
            <strong>{t.title}</strong>
            <span>{t.text}</span>
          </div>
        </li>
      ))}
    </Reveal>
  </div>
);

export default TrustStrip;
