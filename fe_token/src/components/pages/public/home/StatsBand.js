import React from 'react';
import { useCountUp } from './useHomeHooks';
import { STATS } from './homeData';

const Stat = ({ end, suffix, label, aria, desktopOnly }) => {
  const { ref, value } = useCountUp(end);
  return (
    <div className={`hp-stat${desktopOnly ? ' hp-stat--desktop' : ''}`} role="group" aria-label={aria}>
      <p className="hp-stat__num" ref={ref} aria-hidden="true">{value}{suffix}</p>
      <p className="hp-stat__label" aria-hidden="true">{label}</p>
    </div>
  );
};

const StatsBand = () => (
  <section className="hp-stats hp-dark" aria-labelledby="hp-stats-title">
    <h2 id="hp-stats-title" className="sr-only">TeluguSambandham at a glance</h2>
    <div className="hp-container hp-stats__grid">
      {STATS.map((s) => <Stat key={s.label} {...s} />)}
    </div>
  </section>
);

export default StatsBand;
