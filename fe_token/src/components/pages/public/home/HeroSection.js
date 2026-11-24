import React from 'react';
import { Link } from 'react-router-dom';
import heroDesktop2560 from '../../../../assets/images/hero/hero-desktop-2560.webp';
import heroDesktop1600 from '../../../../assets/images/hero/hero-desktop-1600.webp';
import heroDesktopJpg from '../../../../assets/images/hero/hero-desktop-1600.jpg';
import heroMobile1080 from '../../../../assets/images/hero/hero-mobile-1080.webp';
import heroMobile720 from '../../../../assets/images/hero/hero-mobile-720.webp';

// Hero: photo + headline + CTAs. The "Start your journey" mini search form was
// removed (for guests it only led to registration; members have Matches).
const HeroSection = ({ isLoggedIn, sentinelRef }) => (
  <section className="hp-hero hp-dark" aria-labelledby="hp-hero-title">
    <div className="hp-hero__media">
      <picture>
        <source media="(min-width: 768px)" type="image/webp" srcSet={`${heroDesktop1600} 1600w, ${heroDesktop2560} 2560w`} sizes="100vw" />
        <source media="(max-width: 767px)" type="image/webp" srcSet={`${heroMobile720} 720w, ${heroMobile1080} 1080w`} sizes="100vw" />
        <img
          className="hp-hero__img"
          src={heroDesktopJpg}
          alt="Telugu bride and groom during a traditional wedding ritual"
          width="1600"
          height="786"
          fetchPriority="high"
          decoding="async"
        />
      </picture>
      <span className="hp-hero__shade" aria-hidden="true" />
    </div>
    <div className="hp-container hp-hero__grid">
      <div className="hp-hero__copy">
        <span className="hp-chip">Viswabrahmin Community Matrimony</span>
        <h1 id="hp-hero-title">
          Telugu Matrimony for Families Who Value <span className="hp-gold">Tradition and Trust</span>
        </h1>
        <p className="hp-hero__sub">
          Find a caring life partner for yourself or your family member. Register free, create a verified profile and connect with privacy you control.
        </p>
        <div className="hp-hero__cta">
          {isLoggedIn ? (
            <>
              <Link to="/profiles" className="hp-btn hp-btn--gold">View Matches</Link>
              <Link to="/dashboard" className="hp-btn hp-btn--ghost">My Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/signup" className="hp-btn hp-btn--gold">Register Free</Link>
              <Link to="/login" className="hp-btn hp-btn--ghost">Login</Link>
            </>
          )}
        </div>
        {!isLoggedIn && <p className="hp-hero__note">Free registration. No card needed.</p>}
        <div ref={sentinelRef} className="hp-sentinel" aria-hidden="true" />
      </div>
    </div>
  </section>
);

export default HeroSection;
