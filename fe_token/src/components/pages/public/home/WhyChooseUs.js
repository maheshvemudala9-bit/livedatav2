import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import { WHY_TILES } from './homeData';

const WhyChooseUs = () => (
  <section className="hp-section hp-section--cream" aria-labelledby="hp-why-title">
    <div className="hp-container">
      <Reveal className="hp-head">
        <h2 id="hp-why-title" className="hp-title">Why Families Choose TeluguSambandham</h2>
        <p>Privacy, safety and support built around real family needs.</p>
      </Reveal>
      <div className="hp-grid hp-grid--3">
        {WHY_TILES.map((t, i) => (
          <Reveal key={t.title} delay={(i % 3) * 90} className="hp-card hp-tile">
            <span className="hp-tile__icon"><i className={`fas ${t.icon}`} aria-hidden="true" /></span>
            <h3>{t.title}</h3>
            <p>{t.text}</p>
            {t.support && (
              <p className="hp-tile__links">
                <Link to="/contact-us">Contact Us</Link>
              </p>
            )}
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

export default WhyChooseUs;
