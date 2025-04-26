// src/api/notifications/notifications.controller.js
const notificationsService = require('./notifications.service');

exports.sendNotification = async (req, res, next) => {
  try {
    // Expects request body: { channel, recipient, subject, message, templateData? }
    const result = await notificationsService.sendNotification(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.scheduleNotification = async (req, res, next) => {
  try {
    // Expects: { channel, recipient, subject, message, scheduledAt }
    const result = await notificationsService.scheduleNotification(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.markInAppNotificationRead = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const { read } = req.body; // expected boolean
    const result = await notificationsService.markInAppNotificationRead(notificationId, read);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getNotificationHistory = async (req, res, next) => {
  try {
    // Extract all possible filters from query
    const {
      recipient,
      subject,
      message,
      channel,
      status,
      read,
      createdFrom,
      createdTo,
      scheduledFrom,
      scheduledTo,
      deliveredFrom,
      deliveredTo
    } = req.query;

    // Build a filter object and pass straight through
    const filters = {
      recipient,
      subject,
      message,
      channel,
      status,
      read,            // string “true”/“false”
      startDate:     req.query.startDate,
      endDate:       req.query.endDate,
      dateField:     req.query.dateField
    };

    const notifications = await notificationsService.getNotificationHistory(filters);
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};
