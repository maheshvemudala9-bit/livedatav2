// controllers/featuredController.js
// Public "Featured Brides & Grooms" endpoint: GET /api/getFeaturedProfiles
// No auth required. If a valid accessToken cookie is present the viewer's
// opposite gender is returned (viewer + blocked relations excluded).
//
// PRIVACY: only the fields listed in toCard() are ever returned. No phone,
// alternate phone, email, surname, DOB string, payment/membership status.

const jwt = require('jsonwebtoken');
const pool = require('../services/pool');
const blocks = require('../services/blocks');

// Home page shows 4 featured profiles per tab, picked at random on every load.
const PER_LIST = 4;

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

// udob is stored as text "MM/DD/YYYY" (see Signup.js). Returns null if unparsable.
function ageFromDob(udob) {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(udob || '').trim());
  if (!m) return null;
  const month = parseInt(m[1], 10);
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return null;
  const today = new Date();
  let age = today.getFullYear() - year;
  if (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day)) age--;
  return age >= 16 && age <= 100 ? age : null;
}

const clean = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return s || null;
};

// "TS_Adilabad" -> "Adilabad" (state prefixes used by the location lists)
const cleanLocation = (loc, state) => {
  const l = clean(loc);
  return (l ? l.replace(/^[A-Za-z]{2}_/, '').replace(/\s*\((TG|AP|TS)\)\s*$/i, '').trim() : null) || clean(state);
};

function toCard(r) {
  return {
    uid: r.uid,
    matId: 'MAT' + r.uid,
    name: clean(r.ulname),
    age: ageFromDob(r.udob),
    job: clean(r.ujob),
    education: clean(r.degree),
    location: cleanLocation(r.upresentloc, r.ustate),
    gender: r.ugender,
    photo: r.photo || null
  };
}

async function fetchList(gender, viewerUid) {
  const params = [gender];
  let viewerSql = '';
  if (viewerUid) {
    params.push(viewerUid);
    const p = `$${params.length}`;
    viewerSql = `
      AND a.uid <> ${p}
      AND ${blocks.notBlockedBySql('a.uid', p)}
      AND NOT EXISTS (SELECT 1 FROM public.user_blocks vb WHERE vb.blocker_uid = ${p} AND vb.blocked_uid = a.uid)`;
  }
  const { rows } = await pool.query(
    `SELECT a.uid, a.ulname, a.udob, a.ujob, a.upresentloc, a.ustate, a.ugender,
            (SELECT d.degree FROM public.userdetails d WHERE d.uid = a.uid ORDER BY d.id DESC LIMIT 1) AS degree,
            (SELECT CASE WHEN a.hide_picture = true THEN NULL ELSE COALESCE(g.imagepath_thumb, g.imagepath) END
               FROM public.usergallery g
              WHERE g.uid = a.uid AND g.isprofile = true AND g.status = 'approved'
              LIMIT 1) AS photo
       FROM public.users a
      WHERE a.is_featured = true
        AND a.profile_status = 'approved'
        AND COALESCE(a.status, '') NOT IN ('Closed', 'Blocked')
        AND a.marriage_status = 'Active'
        AND a.ugender = $1${viewerSql}
      ORDER BY random()
      LIMIT ${PER_LIST}`,
    params
  );
  return rows.map(toCard);
}

exports.getFeaturedProfiles = async (req, res) => {
  try {
    const viewerUid = optionalUid(req);
    let viewerGender = null;
    if (viewerUid) {
      const v = await pool.query('SELECT ugender FROM public.users WHERE uid = $1', [viewerUid]);
      const g = v.rows[0] && String(v.rows[0].ugender || '').trim().toLowerCase();
      viewerGender = g === 'male' ? 'Male' : g === 'female' ? 'Female' : null;
    }

    // Logged-in viewers see the opposite gender only.
    const wantBrides = viewerGender !== 'Female';
    const wantGrooms = viewerGender !== 'Male';
    const [brides, grooms] = await Promise.all([
      wantBrides ? fetchList('Female', viewerUid) : [],
      wantGrooms ? fetchList('Male', viewerUid) : []
    ]);

    // Random selection on every load, so the response must not be cached.
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Cookie');
    return res.status(200).json({ status: 'Success', data: { brides, grooms } });
  } catch (err) {
    console.error('featuredController.getFeaturedProfiles error:', err.message);
    return res.status(500).json({ status: 'Failure', result: 'Server error.' });
  }
};
