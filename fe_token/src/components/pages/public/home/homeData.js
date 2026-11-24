// Static content for the public Home page. Pure data, no JSX.

export const AGE_OPTIONS = Array.from({ length: 53 }, (_, i) => i + 18); // 18-70

export const MARITAL_OPTIONS = [
  { value: 'Single', label: 'Never Married' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Awaiting Divorce', label: 'Awaiting Divorce' },
];

export const EDUCATION_OPTIONS = [
  'Intermediates', 'Diploma', 'Bachelors', 'Masters', 'Doctorate', 'BTech',
  'MTech', 'MBBS', 'MBA', 'BSc', 'BCom', 'CA',
];

export const MEMBER_TYPES = ['Gold', 'Premium', 'Diamond'];

export const TRUST_ITEMS = [
  { icon: 'fa-shield-alt', title: '100% Verified Profiles', text: 'Every profile is checked before it goes live' },
  { icon: 'fa-user-lock', title: 'Privacy Controls', text: 'Hide your phone and email' },
  { icon: 'fa-image', title: 'Photo Watermark Protection', text: 'Watermarks help prevent photo misuse' },
  { icon: 'fa-user-check', title: 'Admin-Approved Profiles', text: 'Reviewed by our team' },
];

export const SAMPLE_PROFILES = {
  brides: [
    { age: 26, job: 'Software Engineer', city: 'Hyderabad', edu: 'B.Tech' },
    { age: 24, job: 'Doctor', city: 'Visakhapatnam', edu: 'MBBS' },
    { age: 27, job: 'Teacher', city: 'Warangal', edu: 'M.Ed' },
    { age: 25, job: 'Bank Officer', city: 'Vijayawada', edu: 'MBA' },
  ],
  grooms: [
    { age: 29, job: 'Doctor', city: 'Vijayawada', edu: 'MBBS' },
    { age: 28, job: 'Software Engineer', city: 'Bengaluru', edu: 'B.Tech' },
    { age: 30, job: 'Business Owner', city: 'Hyderabad', edu: 'MBA' },
    { age: 27, job: 'Civil Engineer', city: 'Guntur', edu: 'B.Tech' },
  ],
};

export const STEPS = [
  { icon: 'fa-user-plus', title: 'Register free', text: 'Sign up in a few minutes with your basic details.' },
  { icon: 'fa-id-card', title: 'Create your profile', text: 'Add your details, family information and photos.' },
  { icon: 'fa-heart', title: 'Find matches & send proposals', text: 'Search by your preferences and send a proposal to profiles you like.' },
  { icon: 'fa-handshake', title: 'Connect & meet with family', text: 'Talk, involve your families and take the next step together.' },
];

export const WHY_TILES = [
  { icon: 'fa-user-check', title: 'Verified & admin-approved profiles', text: 'Profiles are reviewed by our team before they are shown.' },
  { icon: 'fa-user-lock', title: 'Privacy controls', text: 'Hide your phone number and email, and share photos with watermark protection.' },
  { icon: 'fa-ban', title: 'Block & safety controls', text: 'Block members you do not want to hear from.' },
  { icon: 'fa-comments', title: 'Secure messaging & proposals', text: 'Send proposals and chat inside the platform.' },
  { icon: 'fa-users', title: 'Built for our community', text: 'Made for Telugu and Viswabrahmin families.' },
  { icon: 'fa-headset', title: 'Dedicated support', text: 'Our team in Hyderabad is a message away.', support: true },
];

export const PLANS = [
  { name: 'Gold', icon: 'fa-gem', access: 'View contact numbers of Gold members' },
  { name: 'Premium', icon: 'fa-crown', access: 'View contact numbers of Gold and Premium members' },
  {
    name: 'Diamond', icon: 'fa-gem', ribbon: 'Full Access',
    access: 'View contact numbers of all members, including Diamond.',
  },
];

export const PLAN_COMMON = [
  'Daily contact views (limit set by admin)',
  'Messaging and proposals',
  'Privacy controls',
];

export const STORIES = [
  { names: 'Sai Kiran & Pravallika', initials: ['S', 'P'], role: 'Married in 2024', text: 'We found our soulmate within a month! The privacy features made us feel completely safe.' },
  { names: 'Vamsi & Keerthana', initials: ['V', 'K'], role: 'Married in 2023', text: 'The advanced filters helped us find exactly what we were looking for. Highly recommended!' },
  { names: 'Phani & Sowmya', initials: ['P', 'S'], role: 'Married in 2025', text: 'A seamless experience from start to finish. The mobile interface is incredibly smooth.' },
];

export const STATS = [
  // desktopOnly: hidden on mobile (< 768px)
  { end: 10, suffix: '+', label: 'Active Profiles', aria: '10 plus active profiles', desktopOnly: true },
  { end: 0, suffix: '+', label: 'Happy Couples', aria: '0 plus happy couples', desktopOnly: true },
  { end: 100, suffix: '%', label: 'Verified Profiles', aria: '100 percent verified profiles' },
  { end: 24, suffix: '/7', label: 'Support', aria: '24 by 7 support' },
];

// FAQ items. Optional keys:
//   list      – numbered list shown under the answer
//   guestOnly – hidden for logged-in members
//   link      – adds a "Contact Us" link after the answer
export const FAQS = [
  {
    q: 'Who is TeluguSambandham for?',
    a: 'TeluguSambandham is for Telugu and Viswabrahmin families looking for a life partner for their son or daughter. We especially welcome Viswabrahmin families from all five sub-castes:',
    list: [
      'Kammari (Blacksmiths)',
      'Kamsali / Swarnakara (Goldsmiths)',
      'Kanchari (Brass and bell-metal workers)',
      'Vadrangi (Carpenters)',
      'Shilpi (Sculptors and stone workers)',
    ],
  },
  { q: 'Is registration free?', a: 'Yes. Registration is free, and all membership plans are currently free under our Limited Launch Offer.', guestOnly: true },
  { q: 'Can parents or relatives create a profile?', a: 'Yes. While registering, choose "My relationship with bride/groom" and select your relation. You can manage the profile on behalf of your son, daughter or family member.', guestOnly: true },
  { q: 'How do I register?', a: 'Click Register Free, fill in the basic details and verify your email with the one-time code (OTP) we send you. After that you can complete your profile and add photos.', guestOnly: true },
  { q: 'When will my profile be visible to others?', a: 'Every new profile and photo is reviewed by our team before it appears to other members. This keeps the platform safe and genuine.' },
  { q: 'Are profiles verified?', a: "Profiles are reviewed and approved by our admin team before they appear. Contact numbers become visible only after verification and according to the viewer's plan." },
  { q: 'What details can I add to my profile?', a: 'Personal, education and job details, family details, and horoscope details such as Gothram, Nakshatram, Rasi and Padam, along with your partner preferences.' },
  { q: 'How is my privacy protected?', a: 'You can hide your phone number and email, photos carry a watermark, and you can block members you do not want to hear from.' },
  { q: 'Are my photos safe?', a: 'Every photo carries a "Verified Profile on TeluguSambandham.com" watermark to discourage misuse. When you delete a photo, it is removed permanently from our servers.' },
  { q: 'Who can see contact numbers?', a: "Gold members can view Gold members' contact numbers, Premium members can view Gold and Premium, and Diamond members can view all members. A daily contact-view limit applies." },
  { q: 'How many contact numbers can I view in a day?', a: 'A daily limit applies to all members. Your dashboard shows how many contacts you have viewed today and your remaining limit.' },
  { q: 'How do I connect with a profile I like?', a: 'Send a proposal from their profile. They can accept or decline it, and you will be notified. You can also chat with members through Messages.' },
  { q: 'What happens if I block someone?', a: 'A blocked member can no longer see your profile or send you messages, and they are not told that they were blocked. You can unblock them at any time from their profile.' },
  { q: 'How do I upgrade my plan?', a: 'Upgrades are handled by our team. Please reach out through Help & Support (Contact Us).', link: true },
  { q: 'I forgot my password. What should I do?', a: 'Click "Forgot password?" on the login page, enter your registered email, verify the one-time code (OTP) and set a new password.' },
  { q: 'Can I close my account?', a: 'Yes. Log in and use the "Close My Account" option in your account menu.' },
];
