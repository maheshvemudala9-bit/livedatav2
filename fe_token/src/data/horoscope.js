// Rasi -> Nakshatra -> Pada mapping (single source of truth for the horoscope dropdowns).
// Stored values: rasi = label e.g. "Dhanusu (Sagittarius)", nakshtra = name e.g. "Moola", padam = "1".."4".

const R = (value, english, nakshatras) => ({
  value,
  english,
  label: `${value} (${english})`,
  nakshatras: nakshatras.map(([name, padas]) => ({ name, padas: padas.map(String) })),
});

export const RASIS = [
  R('Dhanusu', 'Sagittarius', [['Moola', [1, 2, 3, 4]], ['Purva Ashadha', [1, 2, 3, 4]], ['Uttara Ashadha', [1]]]),
  R('Kanya', 'Virgo', [['Uttara Phalguni', [2, 3, 4]], ['Hasta', [1, 2, 3, 4]], ['Chitra', [1, 2]]]),
  R('Karkataka', 'Cancer', [['Punarvasu', [4]], ['Pushya', [1, 2, 3, 4]], ['Ashlesha', [1, 2, 3, 4]]]),
  R('Kumbha', 'Aquarius', [['Dhanishta', [3, 4]], ['Shatabhisha', [1, 2, 3, 4]], ['Purva Bhadrapada', [1, 2, 3]]]),
  R('Makara', 'Capricorn', [['Uttara Ashadha', [2, 3, 4]], ['Shravana', [1, 2, 3, 4]], ['Dhanishta', [1, 2]]]),
  R('Meena', 'Pisces', [['Purva Bhadrapada', [4]], ['Uttara Bhadrapada', [1, 2, 3, 4]], ['Revati', [1, 2, 3, 4]]]),
  R('Mesha', 'Aries', [['Ashwini', [1, 2, 3, 4]], ['Bharani', [1, 2, 3, 4]], ['Krittika', [1]]]),
  R('Mithuna', 'Gemini', [['Mrigashira', [3, 4]], ['Ardra', [1, 2, 3, 4]], ['Punarvasu', [1, 2, 3]]]),
  R('Simha', 'Leo', [['Magha', [1, 2, 3, 4]], ['Purva Phalguni', [1, 2, 3, 4]], ['Uttara Phalguni', [1]]]),
  R('Tula', 'Libra', [['Chitra', [3, 4]], ['Swati', [1, 2, 3, 4]], ['Vishakha', [1, 2, 3]]]),
  R('Vrischika', 'Scorpio', [['Vishakha', [4]], ['Anuradha', [1, 2, 3, 4]], ['Jyeshta', [1, 2, 3, 4]]]),
  R('Vrushabha', 'Taurus', [['Krittika', [2, 3, 4]], ['Rohini', [1, 2, 3, 4]], ['Mrigashira', [1, 2]]]),
];

export const RASI_LABELS = RASIS.map((r) => r.label);

// letters only, lowercase: "Purva-Ashadha " -> "purvaashadha"
const key = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '');

const RASI_ALIASES = {
  Dhanusu: ['dhanusu', 'dhanussu', 'dhanus', 'dhanu', 'dhanuvu', 'dhanudhanuvu', 'sagittarius'],
  Kanya: ['kanya', 'virgo'],
  Karkataka: ['karkataka', 'karkatakam', 'karkatak', 'cancer'],
  Kumbha: ['kumbha', 'kumbham', 'kumba', 'kumbh', 'aquarius'],
  Makara: ['makara', 'makaram', 'capricorn'],
  Meena: ['meena', 'meenam', 'mina', 'pisces'],
  Mesha: ['mesha', 'mesham', 'mesh', 'aries'],
  Mithuna: ['mithuna', 'mithunam', 'midhuna', 'midhunam', 'miduna', 'methuna', 'gemini'],
  Simha: ['simha', 'simham', 'singha', 'leo'],
  Tula: ['tula', 'thula', 'tulam', 'libra'],
  Vrischika: ['vrischika', 'vruschikam', 'vruschika', 'vrischikam', 'vrishchika', 'scorpio'],
  Vrushabha: ['vrushabha', 'vrishabha', 'vrushabham', 'vrishabham', 'vrusabha', 'taurus'],
};

const NAK_ALIASES = {
  Ashwini: ['ashwini', 'aswini', 'asvini', 'ashvini'],
  Bharani: ['bharani', 'bharini'],
  Krittika: ['krittika', 'kritika', 'karthika', 'karthigai', 'krithika'],
  Rohini: ['rohini'],
  Mrigashira: ['mrigashira', 'mrigasira', 'mrigashirsha', 'mrugasira', 'mrigasirsha'],
  Ardra: ['ardra', 'arudra', 'aridra'],
  Punarvasu: ['punarvasu', 'punarpoosam', 'punarvasuu'],
  Pushya: ['pushya', 'pushyami', 'pushyam', 'pusya', 'pushyamii'],
  Ashlesha: ['ashlesha', 'aslesha', 'aashlesha', 'ashlesa'],
  Magha: ['magha', 'makha', 'maga'],
  'Purva Phalguni': ['purvaphalguni', 'pubba', 'pubha', 'purvaphalgunii', 'poorvaphalguni'],
  'Uttara Phalguni': ['uttaraphalguni', 'uttara', 'uttaraphalgunii'],
  Hasta: ['hasta', 'hastha'],
  Chitra: ['chitra', 'chitta', 'chithra'],
  Swati: ['swati', 'swathi', 'svati'],
  Vishakha: ['vishakha', 'visakha', 'vishaka', 'visaka'],
  Anuradha: ['anuradha', 'anooradha'],
  Jyeshta: ['jyeshta', 'jyeshtha', 'jyestha', 'jeshta', 'kettai'],
  Moola: ['moola', 'mula', 'mool', 'mulam'],
  'Purva Ashadha': ['purvaashadha', 'purvashada', 'purvashadha', 'purvaashada', 'poorvashada', 'poorvaashadha'],
  'Uttara Ashadha': ['uttaraashadha', 'uttarashada', 'uttarashadha', 'uttaraashada'],
  Shravana: ['shravana', 'sravana', 'shravan', 'sravanam', 'thiruvonam'],
  Dhanishta: ['dhanishta', 'dhanista', 'dhanishtha', 'danishta', 'dhanishtaa'],
  Shatabhisha: ['shatabhisha', 'satabhisha', 'shatabisha', 'satabisha', 'shathabhisha', 'shatabhishak', 'shatabhishaj'],
  'Purva Bhadrapada': ['purvabhadrapada', 'purvabhadra', 'purvabhadrapadha', 'purvaproshthapada', 'poorvabhadra'],
  'Uttara Bhadrapada': ['uttarabhadrapada', 'uttarabhadra', 'uttarabhadrapadha', 'uttaraproshthapada'],
  Revati: ['revati', 'revathi', 'revathii'],
};

const buildLookup = (aliases) => {
  const out = {};
  Object.entries(aliases).forEach(([canon, list]) => list.forEach((a) => { out[a] = canon; }));
  Object.keys(aliases).forEach((c) => { out[key(c)] = c; });
  return out;
};
const RASI_LOOKUP = buildLookup(RASI_ALIASES);
const NAK_LOOKUP = buildLookup(NAK_ALIASES);

// Returns the rasi object or null.
export const findRasi = (value) => {
  const k = key(value);
  // "Dhanu / Dhanuvu (Sagittarius)" -> "dhanudhanuvu"; also try the English part and the first word
  const canon = RASI_LOOKUP[k] || RASI_LOOKUP[key(String(value || '').split('/')[0])] ||
    RASI_LOOKUP[key((String(value || '').match(/\((.*?)\)/) || [])[1])];
  return canon ? RASIS.find((r) => r.value === canon) : null;
};

export const normalizeRasi = (value) => { const r = findRasi(value); return r ? r.label : null; };
export const normalizeNakshatra = (value) => NAK_LOOKUP[key(value)] || null;
export const normalizePadam = (value) => {
  const m = String(value == null ? '' : value).match(/[1-4]/);
  return m ? m[0] : null;
};

export const nakshatrasFor = (rasi) => {
  const r = findRasi(rasi);
  return r ? r.nakshatras.map((n) => n.name) : [];
};

export const padasFor = (rasi, nakshatra) => {
  const r = findRasi(rasi);
  const nk = normalizeNakshatra(nakshatra);
  const n = r && nk ? r.nakshatras.find((x) => x.name === nk) : null;
  return n ? n.padas : [];
};

// Converts saved DB values into canonical dropdown values.
// Returns { rasi, nakshtra, padam, needsReselect }.
export const resolveSaved = (rasi, nakshtra, padam) => {
  const hasAny = [rasi, nakshtra, padam].some((v) => v != null && String(v).trim() !== '');
  const r = normalizeRasi(rasi);
  if (!r) return { rasi: null, nakshtra: null, padam: null, needsReselect: hasAny };
  const n = normalizeNakshatra(nakshtra);
  if (!n || !nakshatrasFor(r).includes(n)) {
    return { rasi: r, nakshtra: null, padam: null, needsReselect: !!(nakshtra || padam) };
  }
  const p = normalizePadam(padam);
  if (!p || !padasFor(r, n).includes(p)) {
    return { rasi: r, nakshtra: n, padam: null, needsReselect: !!padam };
  }
  return { rasi: r, nakshtra: n, padam: p, needsReselect: false };
};
