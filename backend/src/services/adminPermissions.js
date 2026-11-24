// services/adminPermissions.js
// ─────────────────────────────────────────────────────────────────────────────
// Role -> permission map for the admin panel.
//   admin      full access (original admin role)
//   superadmin shadow login + Email OTPs; no user delete, no contact limit
//   moderator  none of the four restricted actions
// Unknown / empty roles get the moderator set (least privilege).
// ─────────────────────────────────────────────────────────────────────────────

const PERMISSIONS = {
  USERS_DELETE: 'users.delete',
  USERS_IMPERSONATE: 'users.impersonate',
  SETTINGS_CONTACT_LIMIT: 'settings.contactLimit',
  EMAIL_OTPS_VIEW: 'emailOtps.view'
};

const ROLES = ['admin', 'superadmin', 'moderator'];

const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  superadmin: [PERMISSIONS.USERS_IMPERSONATE, PERMISSIONS.EMAIL_OTPS_VIEW],
  moderator: []
};

function normalizeRole(role) {
  return ROLES.includes(role) ? role : 'moderator';
}

function getPermissions(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)].slice();
}

function hasPermission(role, permission) {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

module.exports = { ROLES, PERMISSIONS, normalizeRole, getPermissions, hasPermission };
