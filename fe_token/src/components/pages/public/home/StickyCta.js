import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Mobile-only bar for guests. Shown after the hero scrolls out, hidden over the final CTA.
const StickyCta = ({ heroRef, finalRef }) => {
  const [heroGone, setHeroGone] = useState(false);
  const [finalVisible, setFinalVisible] = useState(false);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return undefined;
    const observers = [];
    const watch = (ref, cb) => {
      if (!ref.current) return;
      const io = new IntersectionObserver(([e]) => cb(e), { threshold: 0 });
      io.observe(ref.current);
      observers.push(io);
    };
    watch(heroRef, (e) => setHeroGone(!e.isIntersecting && e.boundingClientRect.top < 0));
    watch(finalRef, (e) => setFinalVisible(e.isIntersecting));
    return () => observers.forEach((o) => o.disconnect());
  }, [heroRef, finalRef]);

  const show = heroGone && !finalVisible;
  return (
    <div className={`hp-sticky ${show ? 'is-on' : ''}`} aria-hidden={!show}>
      <span>Free registration</span>
      <Link to="/signup" className="hp-btn hp-btn--gold" tabIndex={show ? 0 : -1}>Register Free</Link>
    </div>
  );
};

export default StickyCta;
