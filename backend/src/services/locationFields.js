// Validation / normalisation helpers for location values (country, state, district/city).
// The backend does not carry the country > state > district dataset (it lives in the frontend);
// it only checks type and length and compares legacy and new formats consistently.

// Trim a text value. Returns { ok, value }: '' / null / undefined -> null; non-string or longer
// than `max` characters -> ok false.
const cleanLocField = (v, max = 100) => {
  if (v === undefined || v === null) return { ok: true, value: null };
  if (typeof v !== 'string') return { ok: false, value: null };
  const t = v.trim();
  if (t === '') return { ok: true, value: null };
  if (t.length > max) return { ok: false, value: null };
  return { ok: true, value: t };
};

// Same rules as the frontend normalizeLocName: "TS_Adilabad" -> "Adilabad", "Adilabad (TG)" -> "Adilabad".
const normalizeLocName = (s) => {
  if (s === null || s === undefined) return '';
  return String(s)
    .trim()
    .replace(/^[A-Za-z]{2}_/, '')
    .replace(/\s*\((TG|AP|TS)\)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// SQL expression that normalises a column the same way (lowercased).
const locNormSql = (col) =>
  `lower(btrim(regexp_replace(regexp_replace(${col}, '^[A-Za-z]{2}_', ''), '\\s*\\((TG|AP|TS)\\)\\s*$', '', 'i')))`;

// Two-letter abbreviations that older rows hold in users.ustate.
const STATE_ALIASES = {
  'andhra pradesh': ['ap'],
  telangana: ['ts', 'tg'],
};

// Accepted lowercase values for a state filter: the normalised name plus its legacy abbreviations.
const stateFilterValues = (v) => {
  const n = normalizeLocName(v).toLowerCase();
  const list = [n];
  Object.keys(STATE_ALIASES).forEach((full) => {
    if (n === full || STATE_ALIASES[full].includes(n)) {
      list.push(full, ...STATE_ALIASES[full]);
    }
  });
  return Array.from(new Set(list));
};

// Signup placeholders that old cached bundles may still send; treated as "not chosen".
const PLACEHOLDERS = new Set(['Select Country', 'Select State', 'Select District', 'Select birth place']);
const dropPlaceholder = (v) => (typeof v === 'string' && PLACEHOLDERS.has(v.trim()) ? '' : v);

// Matches-page "Working location" filter. The options come from the frontend job-location list
// (country names like USA / UK and city names). Returns the lowercase names that a job_country /
// job_state / job_city value may hold for that option, or null for "Other" / empty (legacy equality only).
const JOB_FILTER_ALIASES = {
  usa: ['united states', 'usa', 'us', 'united states of america'],
  uk: ['united kingdom', 'uk', 'england', 'great britain'],
  uae: ['united arab emirates', 'uae'],
  bengaluru: ['bengaluru', 'bangalore', 'bengaluru urban', 'bangalore urban'],
  bangalore: ['bengaluru', 'bangalore', 'bengaluru urban', 'bangalore urban'],
  mumbai: ['mumbai', 'mumbai city', 'mumbai suburban'],
  delhi: ['delhi', 'new delhi'],
  'delhi-ncr (incl. gurugram, noida)': ['delhi', 'new delhi', 'gurugram', 'gurgaon', 'noida', 'gautam buddha nagar'],
  'visakhapatnam (vizag)': ['visakhapatnam', 'vizag', 'visakhapatnam (vizag)'],
  mangaluru: ['mangaluru', 'mangalore', 'dakshina kannada'],
  mysuru: ['mysuru', 'mysore'],
  kochi: ['kochi', 'cochin', 'ernakulam'],
  thiruvananthapuram: ['thiruvananthapuram', 'trivandrum'],
  guwahati: ['guwahati', 'kamrup metropolitan', 'kamrup metro'],
  vijayawada: ['vijayawada', 'ntr'],
  bhubaneswar: ['bhubaneswar', 'khordha', 'khurda'],
};
const jobLocationCandidates = (v) => {
  const k = String(v == null ? '' : v).trim().toLowerCase();
  if (!k || k === 'other') return null;
  return JOB_FILTER_ALIASES[k] || [k];
};

module.exports = { cleanLocField, normalizeLocName, locNormSql, stateFilterValues, dropPlaceholder, jobLocationCandidates };
