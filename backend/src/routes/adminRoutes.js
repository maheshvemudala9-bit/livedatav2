// routes/adminRoutes.js
// ─────────────────────────────────────────────────────────────────────────────
// The /api/adminhub router. POST /login is public; everything else is behind
// requireAdmin (reads/verifies the adminToken cookie).
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const router = express.Router();

const requireAdmin = require('../middleware/requireAdmin');
const requirePermission = require('../middleware/requirePermission');
const { PERMISSIONS } = require('../services/adminPermissions');
const adminController = require('../controllers/adminController');

// Public
router.post('/login', adminController.login);

// Protected
router.post('/logout', requireAdmin, adminController.logout);
router.get('/me', requireAdmin, adminController.me);
router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/users', requireAdmin, adminController.users);
router.post('/users/status', requireAdmin, adminController.setUserStatus);
router.post('/users/profilestatus', requireAdmin, adminController.setProfileStatus);
router.post('/users/payment-status', requireAdmin, adminController.setPaymentStatus);
router.post('/users/membership-type', requireAdmin, adminController.setMembershipType);
router.post('/users/marriage-status', requireAdmin, adminController.setMarriageStatus);
router.post('/users/featured', requireAdmin, adminController.setFeatured);
router.delete('/users/:uid', requireAdmin, requirePermission(PERMISSIONS.USERS_DELETE), adminController.deleteUser);
router.get('/photos', requireAdmin, adminController.photos);
router.post('/photos/status', requireAdmin, adminController.setPhotoStatus);
router.get('/email-otps', requireAdmin, requirePermission(PERMISSIONS.EMAIL_OTPS_VIEW), adminController.emailOtps);
router.get('/contact-queries', requireAdmin, adminController.contactQueries);
router.get('/blocked-users', requireAdmin, adminController.blockedUsers);
router.get('/messageslist', requireAdmin, adminController.messageslist);
router.get('/settings/contact-limit', requireAdmin, requirePermission(PERMISSIONS.SETTINGS_CONTACT_LIMIT), adminController.getContactLimit);
router.post('/settings/contact-limit', requireAdmin, requirePermission(PERMISSIONS.SETTINGS_CONTACT_LIMIT), adminController.setContactLimit);
router.post('/impersonate', requireAdmin, requirePermission(PERMISSIONS.USERS_IMPERSONATE), adminController.impersonate);

module.exports = router;
