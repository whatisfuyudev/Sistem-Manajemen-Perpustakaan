const express               = require('express');
const router                = express.Router();
const authMiddleware        = require('../../middleware/auth.middleware');
const notificationPageController = require('./notificationPage.controllers');

router.get(
  '/admin/notifications/send',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  notificationPageController.renderAdminNotificationAddAndSchedule
);

// Render Edit Notification page
router.get(
  '/admin/notifications/edit/:id', // e.g. /admin/notifications/edit/123
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin,                      
  notificationPageController.renderAdminNotificationEdit // handler defined below
);

// Render the Admin Notification Detail page (Admin/Librarian only)
router.get(
  '/admin/notifications/:id',           // e.g. /admin/notifications/123
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin,   
  notificationPageController.renderAdminNotificationDetail
);



module.exports = router;
