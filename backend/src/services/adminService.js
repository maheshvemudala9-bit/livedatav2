// services/adminService.js
// ─────────────────────────────────────────────────────────────────────────────
// All admin-side DB access. Follows the repo conventions:
//   • pool.connect() / client.release() (release in finally)
//   • parameterized queries only (no string-concatenated SQL)
//   • display names via concat_ws(' ', ufname, ulname) (NULL-safe)
//   • MAT id surfaced as 'MAT' || uid
// The controller layer is responsible for request-boundary validation; this
// layer trusts validated inputs but still parameterizes as defense-in-depth.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const pool = require('./pool');
const imageService = require('./imageService');

// ── Admin lookup ──────────────────────────────────────────────────────────────
// Match by username OR email. ORDER prefers an exact username match when the
// identifier equals both for different rows (defensive; both columns are UNIQUE).
async function findAdminByIdentifier(identifier) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, email, password, name, role
         FROM public.adminlogin
        WHERE username = $1 OR email = $1
        ORDER BY (username = $1) DESC
        LIMIT 1`,
      [identifier]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// Current admin row by primary key (used to read the live role).
async function getAdminById(id) {
  const adminId = Number(id);
  if (!Number.isInteger(adminId)) return null;
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, email, name, role
         FROM public.adminlogin
        WHERE id = $1`,
      [adminId]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// ── Dashboard ───────────────────────────────────────────────────────────────
// Stat counts + four capped lists for the dashboard widgets.
async function getDashboard() {
  const client = await pool.connect();
  try {
    const [totalUsers, pendingProfiles, pendingPhotos, flaggedCount] = await Promise.all([
      client.query(`SELECT count(*)::int AS c FROM public.users`),
      client.query(`SELECT count(*)::int AS c FROM public.users WHERE profile_status = 'pending'`),
      client.query(`SELECT count(DISTINCT uid)::int AS c FROM public.usergallery WHERE status = 'pending'`),
      client.query(`${flaggedCountSql()}`, [])
    ]);

    const [pendingProfilesList, pendingPhotosList, recentUsersList, flaggedSendersList] = await Promise.all([
      client.query(
        `SELECT uid,
                ('MAT' || uid)                        AS "matId",
                concat_ws(' ', ufname, ulname)        AS name,
                uemail, uphone, status, profile_status AS "profileStatus"
           FROM public.users
          WHERE profile_status = 'pending'
          ORDER BY uid DESC
          LIMIT 10`
      ),
      client.query(
        `SELECT g.id,
                ('MAT' || g.uid)                      AS "matId",
                concat_ws(' ', u.ufname, u.ulname)    AS name,
                g.imagepath, g.imagepath_thumb, g.imagepath_medium,
                g.isprofile, g.status
           FROM public.usergallery g
           JOIN public.users u ON u.uid = g.uid
          WHERE g.status = 'pending'
          ORDER BY g.insertdate DESC
          LIMIT 10`
      ),
      client.query(
        `SELECT uid,
                ('MAT' || uid)                        AS "matId",
                concat_ws(' ', ufname, ulname)        AS name,
                uemail, uphone, status, profile_status AS "profileStatus",
                payment_status, membership_type, marriage_status
           FROM public.users
          ORDER BY uid DESC
          LIMIT 10`
      ),
      client.query(`${flaggedSelectSql()} LIMIT $1 OFFSET $2`, [10, 0])
    ]);

    return {
      stats: {
        totalUsers: totalUsers.rows[0].c,
        pendingProfiles: pendingProfiles.rows[0].c,
        pendingPhotos: pendingPhotos.rows[0].c,
        flaggedSenders: flaggedCount.rows[0].c
      },
      pendingProfilesList: pendingProfilesList.rows,
      pendingPhotosList: pendingPhotosList.rows,
      recentUsersList: recentUsersList.rows,
      flaggedSendersList: flaggedSendersList.rows
    };
  } finally {
    client.release();
  }
}

// ── Users list ────────────────────────────────────────────────────────────────
// whereSql/params built ONCE by the controller and reused verbatim by BOTH the
// data query and the count query (prevents total/row drift).
async function listUsers({ page, limit, whereSql, params }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const dataParams = params.concat([limit, offset]);
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT a.uid,
             ('MAT' || a.uid)                        AS "matId",
             concat_ws(' ', a.ufname, a.ulname)      AS name,
             a.uemail, a.uphone, a.status,
             a.profile_status                        AS "profileStatus",
             a.payment_status, a.membership_type, a.marriage_status,
             CASE WHEN a.is_featured THEN 'Yes' ELSE 'No' END AS featured,
             (SELECT count(*) FROM public.usergallery g WHERE g.uid = a.uid) AS photos_count,
             (SELECT count(*)::int FROM public.user_blocks ub WHERE ub.blocked_uid = a.uid) AS block_count
        FROM public.users a
        ${whereSql}
        ORDER BY a.uid DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const countQuery = `SELECT count(*)::int AS total FROM public.users a ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params)
    ]);

    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

async function setUserStatus(uid, status) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE public.users SET status = $2 WHERE uid = $1 RETURNING uid, status`,
      [uid, status]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

async function setProfileStatus(uid, profileStatus) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE public.users SET profile_status = $2 WHERE uid = $1 RETURNING uid, profile_status`,
      [uid, profileStatus]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// Column names come from this fixed map only; request input is never
// interpolated into SQL. Returns {uid, from, to} or null if the user is missing.
const USER_FIELD_COLUMNS = {
  payment_status: 'payment_status',
  membership_type: 'membership_type',
  marriage_status: 'marriage_status'
};

async function setUserField(uid, field, value) {
  const column = USER_FIELD_COLUMNS[field];
  if (!column) throw new Error('Unsupported field.');
  const client = await pool.connect();
  try {
    const cur = await client.query(
      `SELECT ${column} AS val FROM public.users WHERE uid = $1`,
      [uid]
    );
    if (!cur.rows[0]) return null;
    const { rows } = await client.query(
      `UPDATE public.users SET ${column} = $2 WHERE uid = $1 RETURNING uid, ${column} AS val`,
      [uid, value]
    );
    if (!rows[0]) return null;
    return { uid: rows[0].uid, from: cur.rows[0].val, to: rows[0].val };
  } finally {
    client.release();
  }
}

// Featured flag ('Yes' / 'No'). Sets is_featured and featured_at together
// (re-saving Yes on an already featured user keeps the original featured_at).
// Returns {uid, from, to} as 'Yes'/'No', or null if the user is missing.
async function setUserFeatured(uid, value) {
  const on = value === 'Yes';
  const client = await pool.connect();
  try {
    const cur = await client.query(
      `SELECT is_featured FROM public.users WHERE uid = $1`,
      [uid]
    );
    if (!cur.rows[0]) return null;
    const { rows } = await client.query(
      `UPDATE public.users
          SET is_featured = $2::boolean,
              featured_at = CASE WHEN $2::boolean
                                 THEN CASE WHEN is_featured THEN COALESCE(featured_at, NOW()) ELSE NOW() END
                                 ELSE NULL END
        WHERE uid = $1
    RETURNING uid, is_featured`,
      [uid, on]
    );
    if (!rows[0]) return null;
    return {
      uid: rows[0].uid,
      from: cur.rows[0].is_featured ? 'Yes' : 'No',
      to: rows[0].is_featured ? 'Yes' : 'No'
    };
  } finally {
    client.release();
  }
}

// ── Photos list ────────────────────────────────────────────────────────────────
async function listPhotos({ page, limit, whereSql, params }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const dataParams = params.concat([limit, offset]);
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT g.id,
             ('MAT' || g.uid)                       AS "matId",
             g.uid,
             concat_ws(' ', u.ufname, u.ulname)     AS name,
             g.imagepath, g.imagepath_thumb, g.imagepath_medium,
             g.isprofile, g.status
        FROM public.usergallery g
        JOIN public.users u ON u.uid = g.uid
        ${whereSql}
        ORDER BY CASE WHEN g.status = 'pending' THEN 0 ELSE 1 END, g.insertdate DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const countQuery = `
      SELECT count(*)::int AS total
        FROM public.usergallery g
        JOIN public.users u ON u.uid = g.uid
        ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params)
    ]);

    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

async function setPhotoStatus(id, status) {
  const client = await pool.connect();
  try {
    const cur = await client.query(
      `SELECT status, imagepath, imagepath_medium, imagepath_thumb FROM public.usergallery WHERE id = $1`,
      [id]
    );
    const row = cur.rows[0];
    if (!row) return null;

    if (status !== 'rejected') {
      // Files of rejected photos are deleted, so they cannot be restored.
      if (row.status === 'rejected') return { restoreBlocked: true };
      const { rows } = await client.query(
        `UPDATE public.usergallery SET status = $2 WHERE id = $1 RETURNING id, status`,
        [id, status]
      );
      return rows[0] || null;
    }

    // Reject: keep the row (owner still sees "Rejected"), clear the paths and
    // remove all 3 files from disk once the UPDATE has succeeded.
    const { rows } = await client.query(
      `UPDATE public.usergallery
          SET status = 'rejected', imagepath = NULL, imagepath_medium = NULL, imagepath_thumb = NULL
        WHERE id = $1 RETURNING id, status`,
      [id]
    );
    try {
      imageService.deleteImageFiles(row.imagepath, row.imagepath_medium, row.imagepath_thumb);
    } catch (fileErr) {
      console.error('setPhotoStatus file cleanup error:', fileErr.message);
    }
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// ── Flagged senders (message spam) ──────────────────────────────────────────
// A sender with MORE THAN 10 consecutive trailing messages to the same recipient
// with no reply in between is flagged. Any reply from the recipient resets the
// streak. Computed LIVE, per direction. Soft-delete flags are intentionally
// ignored (deleted_by_sender/receiver not consulted).
//
// The CTE body is shared between the paged SELECT and the COUNT pager so both
// evaluate the same flagged set.
function flaggedCteSql() {
  return `
    WITH pair AS (
      SELECT sender_id, receiver_id,
             max(created_at) AS last_msg_time
        FROM public.messages
       GROUP BY sender_id, receiver_id
    ),
    flagged AS (
      SELECT p.sender_id, p.receiver_id, p.last_msg_time,
             (SELECT count(*) FROM public.messages m
                WHERE m.sender_id   = p.sender_id
                  AND m.receiver_id = p.receiver_id
                  AND (r.last_reply IS NULL OR m.created_at > r.last_reply)
             ) AS unanswered_count
        FROM pair p
        LEFT JOIN LATERAL (
          SELECT max(m2.created_at) AS last_reply
            FROM public.messages m2
           WHERE m2.sender_id   = p.receiver_id
             AND m2.receiver_id = p.sender_id
        ) r ON true
    )`;
}

function flaggedSelectSql() {
  return `${flaggedCteSql()}
    SELECT f.sender_id,
           ('MAT' || f.sender_id)                   AS sender_mat,
           concat_ws(' ', sa.ufname, sa.ulname)     AS sender_name,
           f.receiver_id,
           ('MAT' || f.receiver_id)                 AS recipient_mat,
           concat_ws(' ', ra.ufname, ra.ulname)     AS recipient_name,
           f.unanswered_count,
           f.last_msg_time                          AS last_message_time
      FROM flagged f
      JOIN public.users sa ON sa.uid = f.sender_id
      JOIN public.users ra ON ra.uid = f.receiver_id
     WHERE f.unanswered_count > 10
     ORDER BY f.unanswered_count DESC, f.last_msg_time DESC`;
}

function flaggedCountSql() {
  return `${flaggedCteSql()}
    SELECT count(*)::int AS c
      FROM flagged f
     WHERE f.unanswered_count > 10`;
}

async function listFlaggedSenders({ page, limit }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const [data, count] = await Promise.all([
      client.query(`${flaggedSelectSql()} LIMIT $1 OFFSET $2`, [limit, offset]),
      client.query(flaggedCountSql(), [])
    ]);
    return { rows: data.rows, total: count.rows[0].c };
  } finally {
    client.release();
  }
}

// ── Impersonation tokens ──────────────────────────────────────────────────────
// Single-use, 60-second tokens. Retry ONCE on a UNIQUE collision (23505).
async function createImpersonationToken(uid, adminId) {
  const client = await pool.connect();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = crypto.randomBytes(32).toString('hex'); // 64 chars
      try {
        const { rows } = await client.query(
          `INSERT INTO public.admin_impersonation_tokens (token, uid, admin_id, expires_at)
                VALUES ($1, $2, $3, now() + interval '60 seconds')
             RETURNING token`,
          [token, uid, adminId]
        );
        return rows[0].token;
      } catch (err) {
        if (err.code === '23505' && attempt === 0) continue; // collision — retry once
        throw err;
      }
    }
    // Unreachable in practice; the loop either returns or throws above.
    throw new Error('Failed to create impersonation token.');
  } finally {
    client.release();
  }
}

// ── Contact-view limit setting ──────────────────────────────────────────────
// The daily contact-view limit lives in the app_settings key/value table under
// the key 'daily_contact_view_limit'. Enforcement (dbController) reads it live,
// so updates here take effect on the next request. Default to 5 when missing.
const CONTACT_LIMIT_KEY = 'daily_contact_view_limit';
const CONTACT_LIMIT_DEFAULT = 5;

async function getContactViewLimit() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT value FROM public.app_settings WHERE key = $1`,
      [CONTACT_LIMIT_KEY]
    );
    const parsed = rows[0] ? parseInt(rows[0].value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : CONTACT_LIMIT_DEFAULT;
  } finally {
    client.release();
  }
}

async function setContactViewLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Invalid contact view limit.');
  }
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public.app_settings (key, value, updated_at)
            VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [CONTACT_LIMIT_KEY, String(limit)]
    );
    return limit;
  } finally {
    client.release();
  }
}

// ── Email OTPs list (read-only) ────────────────────────────────────────────
// `search` and `status` are always bound as parameters. `status` is checked
// against a whitelist by the controller. Status is computed with NOW(), the
// same clock db.verifyOtp uses.
async function listEmailOtps({ page, limit, search, status }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];
    if (search) {
      params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
      where.push(`email ILIKE $${params.length}`);
    }
    const statusSql = `CASE WHEN verified THEN 'verified'
                            WHEN expires_at < NOW() THEN 'expired'
                            ELSE 'active' END`;
    if (status && status !== 'all') {
      params.push(status);
      where.push(`${statusSql} = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT id, email, otp, expires_at, verified, created_at,
             ${statusSql} AS status
        FROM public.email_otps
        ${whereSql}
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    const countQuery = `SELECT count(*)::int AS total FROM public.email_otps ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, params.concat([limit, offset])),
      client.query(countQuery, params)
    ]);
    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

// ── Contact Us queries list (read-only) ─────────────────────────────────────
// `search` and `subject` are always bound as parameters; `subject` is checked
// against a whitelist by the controller.
async function listContactQueries({ page, limit, search, subject }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];
    if (search) {
      params.push(`%${search.replace(/[\\%_]/g, '\\$&')}%`);
      const p = `$${params.length}`;
      where.push(`(name ILIKE ${p} OR email ILIKE ${p} OR phone ILIKE ${p} OR message ILIKE ${p})`);
    }
    if (subject) {
      params.push(subject);
      where.push(`subject = $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT id, uid, CASE WHEN uid IS NOT NULL THEN 'MAT' || uid END AS "matId",
             name, email, phone, subject, message, created_at
        FROM public.contact_queries
        ${whereSql}
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;
    const countQuery = `SELECT count(*)::int AS total FROM public.contact_queries ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, params.concat([limit, offset])),
      client.query(countQuery, params)
    ]);
    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

// ── Blocked users list (read-only) ──────────────────────────────────────────
// One row per blocked user: how many users blocked them and who (blocker uids,
// ascending, comma separated). whereSql/params come from buildUserWhere (alias
// `a`) and are shared verbatim by the data and count queries.
async function listBlockedUsers({ page, limit, whereSql, params }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT a.uid,
             ('MAT' || a.uid)                   AS "matId",
             concat_ws(' ', a.ufname, a.ulname) AS name,
             a.uemail,
             b.block_count, b.blocked_by_ids, b.latest_blocked_at
        FROM public.users a
        JOIN (
          SELECT blocked_uid,
                 count(*)::int AS block_count,
                 string_agg(blocker_uid::text, ', ' ORDER BY blocker_uid) AS blocked_by_ids,
                 max(created_at) AS latest_blocked_at
            FROM public.user_blocks
           GROUP BY blocked_uid
        ) b ON b.blocked_uid = a.uid
        ${whereSql}
        ORDER BY b.block_count DESC, b.latest_blocked_at DESC NULLS LAST, a.uid DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const countQuery = `
      SELECT count(*)::int AS total
        FROM public.users a
        JOIN (SELECT DISTINCT blocked_uid FROM public.user_blocks) b ON b.blocked_uid = a.uid
        ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, params.concat([limit, offset])),
      client.query(countQuery, params)
    ]);
    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

// ── Audit log ──────────────────────────────────────────────────────────────
async function writeAudit({ adminId, action, targetUid, details }) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public.admin_audit_log (admin_id, action, target_uid, details)
            VALUES ($1, $2, $3, $4)`,
      [adminId ?? null, action, targetUid ?? null, details != null ? JSON.stringify(details) : null]
    );
  } finally {
    client.release();
  }
}

// ── Cascade hard-delete ──────────────────────────────────────────────────────
// Transactional. Deletes the user and everything tied to them. Tables with an
// ON DELETE CASCADE FK to users(uid) (conversations, messages, proposals,
// proposal_responses, contact_views, admin_impersonation_tokens, user_blocks)
// are handled by
// the final DELETE FROM users. usergallery.uid and userdetails.uid have NO FK,
// so they are deleted explicitly inside the transaction. Image files are removed
// best-effort (failures logged, NOT fatal, NOT rolled back).
async function deleteUserCascade(uid, adminId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gallery = await client.query(
      `SELECT imagepath, imagepath_medium, imagepath_thumb
         FROM public.usergallery WHERE uid = $1`,
      [uid]
    );

    // Best-effort file cleanup (outside the DB's rollback concern).
    gallery.rows.forEach((row) => {
      try {
        imageService.deleteImageFiles(row.imagepath, row.imagepath_medium, row.imagepath_thumb);
      } catch (e) {
        console.error(`deleteUserCascade: file cleanup failed for uid ${uid}:`, e.message);
      }
    });

    await client.query(`DELETE FROM public.usergallery WHERE uid = $1`, [uid]);
    await client.query(`DELETE FROM public.userdetails WHERE uid = $1`, [uid]);
    await client.query(
      `DELETE FROM public.contact_views WHERE viewer_id = $1 OR viewed_uid = $1`,
      [uid]
    );
    await client.query(`DELETE FROM public.users WHERE uid = $1`, [uid]);

    await client.query(
      `INSERT INTO public.admin_audit_log (admin_id, action, target_uid, details)
            VALUES ($1, $2, $3, $4)`,
      [adminId ?? null, 'delete_user', uid, JSON.stringify({ galleryDeleted: gallery.rows.length })]
    );

    await client.query('COMMIT');
    return { uid, galleryDeleted: gallery.rows.length };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best effort */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findAdminByIdentifier,
  getAdminById,
  getDashboard,
  listUsers,
  setUserStatus,
  setProfileStatus,
  setUserField,
  setUserFeatured,
  listPhotos,
  setPhotoStatus,
  listFlaggedSenders,
  createImpersonationToken,
  writeAudit,
  listEmailOtps,
  listContactQueries,
  listBlockedUsers,
  deleteUserCascade,
  getContactViewLimit,
  setContactViewLimit
};
