// maybe do some sort of email notification

// src/api/notifications/notifications.routes.js
const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');

// Manually send a notification
router.post('/send', notificationsController.sendNotification);

// Schedule a notification (e.g., for batch processing)
router.post('/schedule', notificationsController.scheduleNotification);

// Mark an in‑app notification as read/unread
router.put('/inapp/:id/read', notificationsController.markInAppNotificationRead);

// Retrieve notification history (supports query filtering)
router.get('/history', notificationsController.getNotificationHistory);

module.exports = router;
