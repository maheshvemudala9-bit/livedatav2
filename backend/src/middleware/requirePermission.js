// middleware/requirePermission.js
// ─────────────────────────────────────────────────────────────────────────────
// Use AFTER requireAdmin. Reads the admin's CURRENT role from the DB (not the
// JWT claim) so role changes apply without re-login, then enforces `permission`.
// Denied requests get 403 and a 'permission_denied' audit row.
// ─────────────────────────────────────────────────────────────────────────────

const adminService = require('../services/adminService');
const { getPermissions, normalizeRole } = require('../services/adminPermissions');

module.exports = function requirePermission(permission) {
  return async function (req, res, next) {
    try {
      const admin = await adminService.getAdminById(req.admin?.adminId);
      if (!admin) {
        return res.status(401).json({ status: 'Failure', result: 'Admin auth required.' });
      }
      const role = normalizeRole(admin.role);
      const permissions = getPermissions(role);
      req.admin.role = role;
      req.admin.permissions = permissions;

      if (!permissions.includes(permission)) {
        try {
          await adminService.writeAudit({
            adminId: admin.id,
            action: 'permission_denied',
            targetUid: null,
            details: { permission, path: req.originalUrl }
          });
        } catch (auditErr) {
          console.error('requirePermission audit error:', auditErr.message);
        }
        return res.status(403).json({ status: 'Failure', result: 'You do not have permission for this action.' });
      }
      return next();
    } catch (err) {
      console.error('requirePermission error:', err.message);
      return res.status(500).json({ status: 'Failure', result: 'Server error.' });
    }
  };
};
