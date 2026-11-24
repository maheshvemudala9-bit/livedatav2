// Block User helpers. A = blocker, X = blocked user.
// All SQL is parameterized.
const pool = require('./pool');

/** Validate an id: returns a positive integer or null. */
function toUid(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** true when blockerUid has blocked blockedUid. */
async function isBlockedBy(blockerUid, blockedUid) {
  const a = toUid(blockerUid), b = toUid(blockedUid);
  if (!a || !b) return false;
  const { rowCount } = await pool.query(
    'SELECT 1 FROM public.user_blocks WHERE blocker_uid = $1 AND blocked_uid = $2 LIMIT 1',
    [a, b]
  );
  return rowCount > 0;
}

/** { iBlocked: viewer blocked target, blockedMe: target blocked viewer } */
async function blockedRelationship(viewerUid, targetUid) {
  const v = toUid(viewerUid), t = toUid(targetUid);
  if (!v || !t) return { iBlocked: false, blockedMe: false };
  const { rows } = await pool.query(
    `SELECT
       EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_uid = $1 AND blocked_uid = $2) AS i_blocked,
       EXISTS (SELECT 1 FROM public.user_blocks WHERE blocker_uid = $2 AND blocked_uid = $1) AS blocked_me`,
    [v, t]
  );
  return { iBlocked: !!rows[0].i_blocked, blockedMe: !!rows[0].blocked_me };
}

async function isBlockedEitherWay(a, b) {
  const r = await blockedRelationship(a, b);
  return r.iBlocked || r.blockedMe;
}

/** Idempotent block. Returns { success, message }. */
async function blockUser(blockerUid, targetUid) {
  const a = toUid(blockerUid), t = toUid(targetUid);
  if (!a || !t) return { success: false, message: 'targetUid is required.' };
  if (a === t) return { success: false, message: 'You cannot block yourself.' };
  const exists = await pool.query('SELECT 1 FROM public.users WHERE uid = $1', [t]);
  if (exists.rowCount === 0) return { success: false, message: 'User not found.' };
  await pool.query(
    `INSERT INTO public.user_blocks (blocker_uid, blocked_uid) VALUES ($1, $2)
     ON CONFLICT (blocker_uid, blocked_uid) DO NOTHING`,
    [a, t]
  );
  return { success: true, message: 'User blocked.' };
}

/** Idempotent unblock. */
async function unblockUser(blockerUid, targetUid) {
  const a = toUid(blockerUid), t = toUid(targetUid);
  if (!a || !t) return { success: false, message: 'targetUid is required.' };
  await pool.query(
    'DELETE FROM public.user_blocks WHERE blocker_uid = $1 AND blocked_uid = $2',
    [a, t]
  );
  return { success: true, message: 'User unblocked.' };
}

/**
 * SQL fragment: "the row's user has NOT blocked the viewer".
 * uidColumnExpr must be a literal column expression (e.g. 'a.uid') and
 * viewerParamPlaceholder a '$n' placeholder. NEVER pass user input here.
 */
function notBlockedBySql(uidColumnExpr, viewerParamPlaceholder) {
  return `NOT EXISTS (SELECT 1 FROM public.user_blocks ub WHERE ub.blocker_uid = ${uidColumnExpr} AND ub.blocked_uid = ${viewerParamPlaceholder})`;
}

module.exports = {
  toUid,
  isBlockedBy,
  blockedRelationship,
  isBlockedEitherWay,
  blockUser,
  unblockUser,
  notBlockedBySql,
};
