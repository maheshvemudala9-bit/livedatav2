import React from 'react';
import InstallAppButton from './InstallAppButton';

// Floating WhatsApp chat + Call buttons (Home page).
// Number without '+' / spaces for wa.me; Indian country code 91.
const PHONE_LOCAL = '9492654371';
const PHONE_INTL = `91${PHONE_LOCAL}`;
const WHATSAPP_MESSAGE =
  'Hello TeluguSambandham, I would like to know more about registering on telugusambandham.com. Please help me.';

const whatsappHref = `https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const callHref = `tel:+${PHONE_INTL}`;

const ContactFab = () => (
  <div className="hp-fab" role="group" aria-label="Contact us">
    <InstallAppButton />
    <a
      href={callHref}
      className="hp-fab__btn hp-fab__btn--call"
      aria-label={`Call us on +91 ${PHONE_LOCAL}`}
      title="Call us"
    >
      <i className="fas fa-phone-alt" aria-hidden="true" />
      <span className="hp-fab__label">Call us</span>
    </a>
    <a
      href={whatsappHref}
      className="hp-fab__btn hp-fab__btn--wa"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp (opens WhatsApp)"
      title="Chat on WhatsApp"
    >
      <i className="fab fa-whatsapp" aria-hidden="true" />
      <span className="hp-fab__label">WhatsApp</span>
    </a>
  </div>
);

export default ContactFab;
