import React from 'react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';

const FinalCta = ({ isLoggedIn, ctaRef }) => (
  <section ref={ctaRef} className="hp-final hp-dark" aria-labelledby="hp-cta-title">
    <Reveal className="hp-container hp-final__inner">
      <h2 id="hp-cta-title">Ready to Begin Your Journey?</h2>
      <p>Join TeluguSambandham and begin your journey to a happy married life.</p>
      {isLoggedIn ? (
        <Link to="/profiles" className="hp-btn hp-btn--light">View Matches</Link>
      ) : (
        <>
          <Link to="/signup" className="hp-btn hp-btn--light">Register Free</Link>
          <p className="hp-final__alt">Already a member? <Link to="/login">Login</Link></p>
        </>
      )}
    </Reveal>
  </section>
);

export default FinalCta;
