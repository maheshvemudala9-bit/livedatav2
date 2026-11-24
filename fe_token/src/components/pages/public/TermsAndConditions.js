// NOTE: This content is a draft written for TeluguSambandham. A qualified legal
// professional should review it before it is relied upon.
import React from 'react';
import Profiles from '../../templates/ImagesLoader';
import '../../../assets/css/pages/terms.css';

const LAST_UPDATED = 'November 2026';
const SUPPORT_EMAIL = 'support@telugusambandham.com';

// Edit the text here. Each section: title, optional paragraphs, optional bullets.
const SECTIONS = [
  {
    title: 'Introduction and acceptance',
    paragraphs: [
      'Welcome to TeluguSambandham ("we", "us", "the Platform"), an online matrimony service for Telugu families. By registering, logging in or otherwise using this website, you agree to these Terms & Conditions. If you do not agree, please do not use the Platform.',
    ],
  },
  {
    title: 'Eligibility',
    bullets: [
      'Women must be at least 18 years old and men must be at least 21 years old, as required by Indian marriage law.',
      'You must be legally free to marry under the law and personal law that applies to you.',
      'The Platform is for genuine matrimonial purposes only. It is not a dating service and must not be used for casual relationships or friendships.',
      'A parent, guardian or relative may create a profile on behalf of a family member only with that person\'s knowledge and consent.',
    ],
  },
  {
    title: 'Account registration and accuracy of information',
    paragraphs: [
      'You agree to give true, current and complete information when you register and to keep it updated. Details such as name, age, marital status, religion, caste, education, occupation, income and family information must be correct.',
      'We may ask for proof of the information you provide. Accounts with false or misleading details may be suspended or removed.',
    ],
  },
  {
    title: 'Account security, password and OTP verification',
    paragraphs: [
      'You are responsible for keeping your password confidential and for all activity under your account. We may verify your email address with a one-time password (OTP). Do not share your password or OTP with anyone.',
      `If you suspect unauthorised use of your account, change your password at once and write to us at ${SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: 'Profile content, photos and admin approval',
    paragraphs: [
      'Profiles and photos you upload are reviewed by our administrators. We may approve, reject, edit or remove any profile or photo at our discretion, for example if it is unclear, inappropriate, belongs to someone else or breaks these terms.',
      'Photos shown on the Platform carry the watermark "Verified Profile on TeluguSambandham.com" to discourage misuse. You must not crop, edit or remove the watermark, or copy photos of other members.',
      'You confirm that you own or have the right to use every photo and piece of text you upload.',
    ],
  },
  {
    title: 'Use of the service and prohibited conduct',
    paragraphs: ['You agree not to:'],
    bullets: [
      'create a fake profile or a profile of another person without permission;',
      'harass, threaten, abuse or pressure any member;',
      'use the Platform for commercial purposes, advertising, solicitation or promotion of any product or service;',
      'share or publish another member\'s contact details or photos without consent;',
      'scrape, copy or collect data from the Platform by automated or manual bulk means;',
      'post obscene, offensive, defamatory or unlawful content;',
      'misrepresent your caste, religion, marital status, age, income, education or any other detail.',
    ],
  },
  {
    title: 'Interests, messaging and contact details',
    paragraphs: [
      'Members may send interests or proposals, exchange messages and view contact details of other members. The number of contact details you can view may be limited. Use any contact information or message only for the purpose of matrimony, and treat it as confidential.',
    ],
  },
  {
    title: 'Privacy and data',
    paragraphs: [
      'We collect and use your personal information to run the Platform, show your profile to other members, verify accounts and improve the service. A separate Privacy Policy may also apply. By using the Platform you consent to this use of your information. Details you place on your profile will be visible to other members according to the Platform\'s features.',
    ],
  },
  {
    title: 'User responsibility and safety advice',
    paragraphs: ['Please take care when dealing with people you meet through the Platform.'],
    bullets: [
      'Verify the details, family background and employment of a match independently before making any decision.',
      'Meet first in a public place and involve your family or trusted friends.',
      'Never send money or share bank, card or OTP details with anyone you meet on the Platform.',
      'Report suspicious profiles or behaviour to us immediately.',
    ],
  },
  {
    title: 'No guarantee of a match',
    paragraphs: [
      'TeluguSambandham is an intermediary that helps members find each other. We do not guarantee that you will find a match or that any profile is accurate. We do not verify every claim made by members, and we are not a party to any relationship or marriage that results from use of the Platform.',
    ],
  },
  {
    title: 'Payments and membership',
    paragraphs: [
      'Registration is currently offered free of charge. If paid features or memberships are introduced, the applicable fees and refund terms will be shown clearly at the time of purchase.',
    ],
  },
  {
    title: 'Intellectual property',
    paragraphs: [
      'The Platform, including its name, logo, design, layout and software, belongs to TeluguSambandham and is protected by law. You may not copy, modify or distribute any part of it without our written permission. You keep ownership of the content you upload, and you give us a non-exclusive licence to display and use it on the Platform for providing the service.',
    ],
  },
  {
    title: 'Termination and suspension',
    paragraphs: [
      'You may close your account at any time using the "Close My Account" option in your dashboard. We may suspend or terminate your account, with or without notice, if you break these terms, give false information or misuse the Platform.',
    ],
  },
  {
    title: 'Limitation of liability and indemnity',
    paragraphs: [
      'To the extent permitted by law, TeluguSambandham is not liable for any loss or damage arising from your use of the Platform, your dealings with other members, inaccurate information on profiles, or interruptions in the service.',
      'You agree to compensate us for any claim, loss or expense that arises from your breach of these terms or your misuse of the Platform.',
    ],
  },
  {
    title: 'Changes to these terms',
    paragraphs: [
      'We may update these terms from time to time. The latest version will be shown on this page with its date. Continued use of the Platform after a change means you accept the updated terms.',
    ],
  },
  {
    title: 'Governing law and jurisdiction',
    paragraphs: [
      'These terms are governed by the laws of India. The courts at Hyderabad, Telangana will have exclusive jurisdiction over any dispute.',
    ],
  },
  {
    title: 'Grievance and contact',
    paragraphs: [
      'For questions, complaints or to report misuse, please contact us:',
    ],
    contact: true,
  },
];

const TermsAndConditions = () => (
  <>
    <div
      className="inner-heading"
      style={{ backgroundImage: `url(${Profiles.titlebg})` }}
    >
      <div className="container">
        <h1>Terms &amp; Conditions</h1>
      </div>
    </div>

    <div className="inner-content">
      <div className="container">
        <div className="tc-card">
          <p className="tc-updated">Last updated: {LAST_UPDATED}</p>
          <p>
            Please read these Terms &amp; Conditions carefully before using TeluguSambandham.
          </p>

          {SECTIONS.map((s, i) => (
            <section className="tc-section" key={s.title}>
              <h2>{i + 1}. {s.title}</h2>
              {(s.paragraphs || []).map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {s.bullets && (
                <ul>
                  {s.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
              {s.contact && (
                <p>
                  Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                  <br />
                  Address: Kukatpally &amp; Alwal, Hyderabad, Telangana, India
                </p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  </>
);

export default TermsAndConditions;
