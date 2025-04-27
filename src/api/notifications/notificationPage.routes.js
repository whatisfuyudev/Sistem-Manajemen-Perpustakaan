const express               = require('express');
const router                = express.Router();
const authMiddleware        = require('../../middleware/auth.middleware');
const notificationPageController = require('./notificationPage.controllers');

// Render the Admin Notification Detail page (Admin/Librarian only)
router.get(
  '/admin/notifications/:id',           // e.g. /admin/notifications/123
  authMiddleware.verifyToken,           // must be logged in
  authMiddleware.isLibrarianOrAdmin,    // only staff
  notificationPageController.renderAdminNotificationDetail
);

module.exports = router;
