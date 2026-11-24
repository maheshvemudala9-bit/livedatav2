// Base URL for every API call (user + admin axios instances, EditProfile).
// Switch environments by commenting/uncommenting the lines below.
// REACT_APP_API_BASE_URL (if set in .env) still overrides these.

// ── LOCAL ──────────────────────────────────────────────
const API_URL = 'http://localhost:9012/api';

// ── PRODUCTION (uncomment this and comment LOCAL to go live) ──
// const API_URL = 'https://telugusambandham.com/api';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || API_URL;
