// src/components/pages/public/Home.js
import React, { useContext, useRef } from 'react';
import { AuthContext } from '../../hooks/AuthContext';
import '../../../assets/css/Home.css';
import HeroSection from './home/HeroSection';
import TrustStrip from './home/TrustStrip';
import SearchSection from './home/SearchSection';
import FeaturedProfiles from './home/FeaturedProfiles';
import HowItWorks from './home/HowItWorks';
import WhyChooseUs from './home/WhyChooseUs';
import MembershipPlans from './home/MembershipPlans';
import SuccessStories from './home/SuccessStories';
import StatsBand from './home/StatsBand';
import FaqSection from './home/FaqSection';
import FinalCta from './home/FinalCta';
import StickyCta from './home/StickyCta';
import ContactFab from './home/ContactFab';
import WelcomeModal from './home/WelcomeModal';

const Home = () => {
  const { isLoggedIn } = useContext(AuthContext);
  // Opposite of the logged-in user's gender ('' when unknown)
  const myGender = String(localStorage.getItem('userGender') || '').trim().toLowerCase();
  const oppositeGender = myGender === 'male' ? 'Female' : myGender === 'female' ? 'Male' : '';
  const heroSentinel = useRef(null);
  const finalRef = useRef(null);

  return (
    <main className="hp-page">
      <HeroSection isLoggedIn={isLoggedIn} sentinelRef={heroSentinel} />
      <TrustStrip />
      {/* Find Your Match: members only (visitors register first) */}
      {isLoggedIn && <SearchSection isLoggedIn={isLoggedIn} oppositeGender={oppositeGender} />}
      <FeaturedProfiles isLoggedIn={isLoggedIn} />
      {/* Registration steps: visitors only */}
      {!isLoggedIn && <HowItWorks isLoggedIn={isLoggedIn} />}
      <WhyChooseUs />
      <MembershipPlans isLoggedIn={isLoggedIn} />
      <SuccessStories />
      <StatsBand />
      <FaqSection isLoggedIn={isLoggedIn} />
      <FinalCta isLoggedIn={isLoggedIn} ctaRef={finalRef} />
      {!isLoggedIn && <StickyCta heroRef={heroSentinel} finalRef={finalRef} />}
      <ContactFab />
      {/* Welcome announcement: visitors only, ~1s after load */}
      {!isLoggedIn && <WelcomeModal />}
    </main>
  );
};

export default Home;
