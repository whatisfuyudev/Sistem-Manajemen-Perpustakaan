// src/api/notifications/notifications.routes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Apply to all routes in this router:
router.use(authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin);

// Manually send a notification
router.post('/send', notificationsController.sendNotification);

// Schedule a notification (e.g., for batch processing)
router.post('/schedule', notificationsController.scheduleNotification);

// Retrieve notification history (supports query filtering)
router.get('/history', notificationsController.getNotificationHistory);

// Mark an in‑app notification as read/unread
router.put('/inapp/:id/read', notificationsController.markInAppNotificationRead);

//  ➤ Update a notification by ID
router.put(
  '/:id',                             // e.g. PUT /api/notifications/123
  notificationsController.updateNotification
);

module.exports = router;
