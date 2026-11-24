// Single source of truth for SEO data.
// CommonJS on purpose: it is imported by the app (webpack) AND required by
// scripts/seo-postbuild.js (plain Node). Do not use ESM syntax here.
//
// REACT_APP_SITE_URL is read from the real environment (CRA also injects .env
// values into the app bundle, but the Node post-build script only sees real
// environment variables / Docker build args).

const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://telugusambandham.com').replace(/\/+$/, '');
const SITE_NAME = 'TeluguSambandham';
const SUPPORT_EMAIL = 'support@telugusambandham.com';
const LOCALE = 'en_IN';

// Strip query/hash and any trailing slash (except root), return an absolute URL.
function absoluteUrl(path) {
  let p = String(path || '/').split('#')[0].split('?')[0];
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p === '/' ? SITE_URL + '/' : SITE_URL + p;
}

const DEFAULT_OG_IMAGE = SITE_URL + '/og-image.png';
const LOGO_URL = SITE_URL + '/logo512.png';

const ORGANIZATION_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL + '/',
  logo: LOGO_URL,
  email: SUPPORT_EMAIL,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kukatpally & Alwal',
    addressLocality: 'Hyderabad',
    addressRegion: 'Telangana',
    addressCountry: 'IN',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: SUPPORT_EMAIL,
    areaServed: 'IN',
    availableLanguage: 'English',
  },
};

const WEBSITE_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL + '/',
};

function contactPageJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Us | ' + SITE_NAME,
    url: absoluteUrl('/contact-us'),
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL + '/' },
  };
}

const suffix = ' | ' + SITE_NAME;

// One entry per route. `noindex: true` routes never reach the sitemap.
const ROUTE_SEO = {
  home: {
    title: 'Telugu Matrimony – Telugu Brides & Grooms' + suffix,
    description:
      'TeluguSambandham is a family-oriented Telugu matrimony service in Hyderabad. Register free and browse verified profiles from Telangana and Andhra Pradesh.',
    path: '/',
    noindex: false,
    changefreq: 'weekly',
    priority: '1.0',
  },
  signup: {
    title: 'Register Free – Telugu Matrimony Sign Up' + suffix,
    description:
      'Create your free TeluguSambandham profile. Registration is open to Telugu brides and grooms from Telangana and Andhra Pradesh looking for a life partner.',
    path: '/signup',
    noindex: false,
    changefreq: 'monthly',
    priority: '0.8',
  },
  contact: {
    title: 'Contact Us – Telugu Matrimony Support' + suffix,
    description:
      'Contact the TeluguSambandham team for help with registration, profiles, membership or payments. Send a query online or email support@telugusambandham.com.',
    path: '/contact-us',
    noindex: false,
    changefreq: 'monthly',
    priority: '0.6',
    jsonLd: [contactPageJsonLd()],
  },
  terms: {
    title: 'Terms & Conditions – Telugu Matrimony' + suffix,
    description:
      'Read the terms and conditions for using TeluguSambandham: eligibility, account security, profile and photo rules, messaging, privacy, safety advice and more.',
    path: '/terms-and-conditions',
    noindex: false,
    changefreq: 'yearly',
    priority: '0.3',
  },

  login: { title: 'Log in' + suffix, description: 'Log in to your TeluguSambandham account.', path: '/login', noindex: true },
  forgotPassword: { title: 'Forgot password' + suffix, description: 'Reset your TeluguSambandham password.', path: '/forgotpassword', noindex: true },
  profiles: { title: 'Matches' + suffix, description: 'Your matches on TeluguSambandham.', path: '/profiles', noindex: true },
  profileDetails: { title: 'Profile details' + suffix, description: 'Member profile on TeluguSambandham.', path: '/profiledetails', noindex: true },
  advanceSearch: { title: 'Advanced search' + suffix, description: 'Search profiles on TeluguSambandham.', path: '/advancesearch', noindex: true },
  dashboard: { title: 'Dashboard' + suffix, description: 'Your TeluguSambandham dashboard.', path: '/dashboard', noindex: true },
  editProfile: { title: 'Edit profile' + suffix, description: 'Edit your TeluguSambandham profile.', path: '/editprofile', noindex: true },
  changePassword: { title: 'Change password' + suffix, description: 'Change your TeluguSambandham password.', path: '/changepassword', noindex: true },
  closeAccount: { title: 'Close account' + suffix, description: 'Close your TeluguSambandham account.', path: '/closeaccount', noindex: true },
  addGallery: { title: 'My photos' + suffix, description: 'Manage your TeluguSambandham photos.', path: '/addgallery', noindex: true },
  profileSecurity: { title: 'Profile security' + suffix, description: 'Manage your TeluguSambandham profile security.', path: '/profilesecurity', noindex: true },
  messages: { title: 'Messages' + suffix, description: 'Your TeluguSambandham messages.', path: '/messages', noindex: true },
  adminLogin: { title: 'Admin login' + suffix, description: 'Admin login.', path: '/adminhub/matrimony/login', noindex: true },
  admin: { title: 'Admin' + suffix, description: 'Admin panel.', path: '/adminhub/matrimony', noindex: true },
  impersonate: { title: 'Signing in' + suffix, description: 'Signing in.', path: '/impersonate', noindex: true },
  notFound: { title: 'Page not found' + suffix, description: 'The page you are looking for does not exist.', path: '/404', noindex: true },
};

const INDEXABLE_ROUTES = Object.keys(ROUTE_SEO)
  .filter((k) => !ROUTE_SEO[k].noindex)
  .map((k) => ({ key: k, ...ROUTE_SEO[k] }));

module.exports = {
  SITE_URL,
  SITE_NAME,
  SUPPORT_EMAIL,
  LOCALE,
  DEFAULT_OG_IMAGE,
  LOGO_URL,
  absoluteUrl,
  ORGANIZATION_JSONLD,
  WEBSITE_JSONLD,
  contactPageJsonLd,
  ROUTE_SEO,
  INDEXABLE_ROUTES,
};
