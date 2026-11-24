// controllers/contactController.js
// Public "Contact Us" submit endpoint: POST /api/contactUs
// No auth required. If a valid accessToken cookie is present the submitter's
// uid is recorded; guests are accepted with uid = NULL.

const jwt = require('jsonwebtoken');
const pool = require('../services/pool');

const SUBJECTS = [
  'Registration / Profile Help',
  'Membership / Payment',
  'Report a Profile',
  'Technical Issue',
  'Feedback / Suggestion',
  'Other'
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9\s-]+$/;

// ── Simple in-memory rate limit: max 5 submissions per IP per 15 minutes ──────
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const hits = new Map(); // ip -> [timestamps]

function clientIp(req) {
  // Behind a reverse proxy the nearest proxy appends the real client IP last;
  // earlier entries can be forged by the client.
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const parts = String(xff).split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.ip || (req.socket && req.socket.remoteAddress) || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// Drop stale entries so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) {
    const recent = list.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (recent.length) hits.set(ip, recent); else hits.delete(ip);
  }
}, RATE_LIMIT_WINDOW_MS).unref();

// Optional auth: uid from a valid accessToken cookie, otherwise null.
function optionalUid(req) {
  try {
    const token = req.cookies && req.cookies.accessToken;
    if (!token) return null;
    const payload = jwt.verify(token, process.env.TOKEN_SECRET);
    const uid = Number(payload && payload.uid);
    return Number.isInteger(uid) && uid > 0 ? uid : null;
  } catch (_) {
    return null;
  }
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

function validate(body) {
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const subject = str(body.subject);
  const message = str(body.message);

  if (name.length < 2 || name.length > 100) return { error: 'Name must be 2 to 100 characters.' };
  if (!email || email.length > 255 || !EMAIL_RE.test(email)) return { error: 'Please enter a valid email address.' };
  const digits = phone.replace(/[\s+-]/g, '');
  if (phone.lastIndexOf('+') > 0) return { error: 'Please enter a valid phone / WhatsApp number (10 to 15 digits).' };
  if (!PHONE_RE.test(phone) || digits.length < 10 || digits.length > 15) {
    return { error: 'Please enter a valid phone / WhatsApp number (10 to 15 digits).' };
  }
  if (!SUBJECTS.includes(subject)) return { error: 'Please select a valid subject.' };
  if (message.length < 10 || message.length > 2000) return { error: 'Message must be 10 to 2000 characters.' };

  return { value: { name, email, phone: (phone.startsWith('+') ? '+' : '') + digits, subject, message } };
}

exports.submitContactQuery = async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Honeypot: bots fill the hidden field. Pretend success, save nothing.
    if (str(body.website)) {
      return res.status(200).json({ status: 'Success', result: 'Thank you! We have received your query.' });
    }

    const ip = clientIp(req);
    if (isRateLimited(ip)) {
      return res.status(429).json({ status: 'Failure', result: 'Too many requests. Please try again later.' });
    }

    const { value, error } = validate(body);
    if (error) return res.status(200).json({ status: 'Failure', result: error });

    await pool.query(
      `INSERT INTO public.contact_queries (uid, name, email, phone, subject, message, ip)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [optionalUid(req), value.name, value.email, value.phone, value.subject, value.message, String(ip).slice(0, 64)]
    );
    return res.status(200).json({ status: 'Success', result: 'Thank you! We have received your query.' });
  } catch (err) {
    console.error('contactController.submitContactQuery error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error. Please try again later.' });
  }
};

exports.SUBJECTS = SUBJECTS;
