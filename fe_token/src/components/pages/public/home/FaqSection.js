import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';
import { FAQS } from './homeData';

const FaqSection = ({ isLoggedIn }) => (
  <section className="hp-section hp-section--cream" aria-labelledby="hp-faq-title">
    <div className="hp-container hp-container--narrow">
      <Reveal className="hp-head">
        <h2 id="hp-faq-title" className="hp-title">Frequently Asked Questions</h2>
      </Reveal>
      <Reveal delay={80}>
        {FAQS.filter((f) => !(isLoggedIn && f.guestOnly)).map((f) => (
          <details key={f.q} className="hp-faq">
            <summary>{f.q}</summary>
            <p>
              {f.a}
              {f.link && <> <Link to="/contact-us">Contact Us</Link></>}
            </p>
            {f.list && (
              <ol className="hp-faq__list">
                {f.list.map((item) => <li key={item}>{item}</li>)}
              </ol>
            )}
          </details>
        ))}
      </Reveal>
    </div>
  </section>
);

export default FaqSection;
