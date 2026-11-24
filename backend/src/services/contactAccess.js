// Contact (mobile number) visibility rules. Pure functions, no DB access.
// See .agents/tasks/membership-plan.md "Rule matrix".

const PAYMENT_STATUSES = ['Pending', 'Paid', 'Unpaid'];
const MEMBERSHIP_TYPES = ['Gold', 'Premium', 'Diamond'];
const MARRIAGE_STATUSES = ['Active', 'Marriage Settled'];

const REASONS = {
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  UPGRADE_REQUIRED: 'UPGRADE_REQUIRED',
  DIAMOND_ONLY: 'DIAMOND_ONLY',
  MARRIAGE_SETTLED: 'MARRIAGE_SETTLED'
};

const MESSAGES = {
  PAYMENT_REQUIRED: 'Verification pending. Once verified, you can view contacts.',
  UPGRADE_REQUIRED: `You can't view this contact. This member has restricted their visibility.`,
  DIAMOND_ONLY: `You can't view this contact. This member has restricted their visibility.`,
  MARRIAGE_SETTLED: "This person's marriage is already settled."
};

const RANK = { Gold: 1, Premium: 2, Diamond: 3 };

// Fail closed: unknown viewer tier -> Gold, unknown owner tier -> Diamond.
const viewerRank = (t) => RANK[t] || RANK.Gold;
const ownerRank = (t) => RANK[t] || RANK.Diamond;
const ownerTier = (t) => (RANK[t] ? t : 'Diamond');

function canViewContact(viewer, owner) {
  const v = viewer || {};
  const o = owner || {};
  const allow = { allowed: true, reason: null, requiredMembership: null };
  const deny = (reason, requiredMembership) => ({ allowed: false, reason, requiredMembership: requiredMembership || null });

  if (v.uid != null && Number(v.uid) === Number(o.uid)) return allow;

  const paid = v.payment_status === 'Paid';
  const vr = viewerRank(v.membership_type);

  if (o.marriage_status === 'Marriage Settled') {
    if (vr !== RANK.Diamond) return deny(REASONS.MARRIAGE_SETTLED, 'Diamond');
    if (!paid) return deny(REASONS.PAYMENT_REQUIRED);
    return allow;
  }

  if (!paid) return deny(REASONS.PAYMENT_REQUIRED);

  if (ownerTier(o.membership_type) === 'Diamond') {
    return vr === RANK.Diamond ? allow : deny(REASONS.DIAMOND_ONLY, 'Diamond');
  }
  if (vr >= ownerRank(o.membership_type)) return allow;
  return deny(REASONS.UPGRADE_REQUIRED, o.membership_type);
}

// Tier-only lock for list badges. Payment status is ignored (forced Paid) so only
// membership tier / marriage-settled rules produce a result.
// Returns null when allowed, else { reason, requiredMembership }.
function tierContactLock(viewer, owner) {
  const r = canViewContact({ ...(viewer || {}), payment_status: 'Paid' }, owner);
  if (r.allowed) return null;
  return { reason: r.reason, requiredMembership: r.requiredMembership || null };
}

// Strip secrets / other users' private fields from a users row (returns a copy).
function sanitizeUserRow(row, viewerUid, targetUid) {
  if (!row || typeof row !== 'object') return row;
  const out = { ...row };
  delete out.upassword;
  const isOwner = viewerUid != null && targetUid != null && Number(viewerUid) === Number(targetUid);
  if (!isOwner) {
    delete out.uphone;
    delete out.ualtphone;
    delete out.payment_status;
    delete out.membership_type;
  }
  return out;
}

// Alternate phone: strip spaces/hyphens, allow optional leading +, 10-15 digits.
// Returns { ok, value } where value is null for an empty input, or { ok:false, error }.
function normalizeAltPhone(raw) {
  const s = String(raw == null ? '' : raw).replace(/[\s-]/g, '');
  if (s === '') return { ok: true, value: null };
  if (!/^\+?\d{10,15}$/.test(s)) {
    return { ok: false, error: 'Alternate phone number must be 10 to 15 digits (optional leading +).' };
  }
  return { ok: true, value: s };
}

function buildContactAccessPayload(access, ownerMarriageStatus) {
  const a = access || { allowed: false, reason: null, requiredMembership: null };
  return {
    marriageSettled: ownerMarriageStatus === 'Marriage Settled',
    contactAccess: {
      allowed: !!a.allowed,
      reason: a.reason || null,
      requiredMembership: a.requiredMembership || null
    }
  };
}

module.exports = {
  PAYMENT_STATUSES,
  MEMBERSHIP_TYPES,
  MARRIAGE_STATUSES,
  REASONS,
  MESSAGES,
  canViewContact,
  tierContactLock,
  sanitizeUserRow,
  normalizeAltPhone,
  buildContactAccessPayload
};
