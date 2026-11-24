import React, { useState, useEffect } from 'react';
import Reveal from './Reveal';
import { usePrefersReducedMotion } from './useHomeHooks';
import { STORIES } from './homeData';

const SuccessStories = () => {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [stopped, setStopped] = useState(false); // user used a control
  const n = STORIES.length;
  const auto = !reduced && !paused && !stopped;

  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') setIndex((i) => (i + 1) % n);
    }, 6000);
    return () => clearInterval(id);
  }, [auto, n]);

  const go = (i) => { setStopped(true); setIndex((i + n) % n); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
  };

  const onBlur = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
  };

  return (
    <section className="hp-section" aria-labelledby="hp-stories-title">
      <div className="hp-container">
        <Reveal className="hp-head">
          <h2 id="hp-stories-title" className="hp-title">Success Stories</h2>
          <p>Families who began their journey with TeluguSambandham.</p>
        </Reveal>
        <Reveal delay={100}>
          <div
            className="hp-carousel"
            role="region"
            aria-roledescription="carousel"
            aria-label="Success stories"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
          >
            <div className="hp-carousel__viewport">
              <div
                className="hp-carousel__track"
                style={{ transform: `translateX(-${index * 100}%)` }}
                aria-live={auto ? 'off' : 'polite'}
              >
                {STORIES.map((s, i) => (
                  <figure
                    key={s.names}
                    className="hp-story"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${n}`}
                    aria-hidden={i !== index}
                  >
                    <span className="hp-monos" aria-hidden="true">
                      <b>{s.initials[0]}</b><b>{s.initials[1]}</b>
                    </span>
                    <i className="fas fa-quote-left hp-story__q" aria-hidden="true" />
                    <blockquote>{s.text}</blockquote>
                    <figcaption><strong>{s.names}</strong><span>{s.role}</span></figcaption>
                  </figure>
                ))}
              </div>
            </div>
            <div className="hp-carousel__ctrl">
              <button type="button" className="hp-round" aria-label="Previous story" onClick={() => go(index - 1)}>
                <i className="fas fa-chevron-left" aria-hidden="true" />
              </button>
              <div className="hp-dots">
                {STORIES.map((s, i) => (
                  <button
                    key={s.names}
                    type="button"
                    className={`hp-dot ${i === index ? 'is-active' : ''}`}
                    aria-label={`Go to story ${i + 1} of ${n}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => go(i)}
                  />
                ))}
              </div>
              <button type="button" className="hp-round" aria-label="Next story" onClick={() => go(index + 1)}>
                <i className="fas fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default SuccessStories;
