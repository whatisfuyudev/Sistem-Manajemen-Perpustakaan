// src/api/notifications/notifications.service.js
const Notification = require('../../models/notification.model');
const emailHelper = require('../../utils/emailHelper');
const smsHelper = require('../../utils/smsHelper');

/**
 * Sends a notification via the specified channel.
 * Saves a pending notification record, sends the message, and updates the record status.
 */
exports.sendNotification = async (data) => {
  const { channel, recipient, subject, message } = data;
  // Create a pending notification record
  const notificationRecord = await Notification.create({
    channel,
    recipient,
    subject,
    message,
    status: 'pending'
  });
  
  try {
    let result;
    if (channel === 'email') {
      result = await emailHelper.sendEmail({ to: recipient, subject, html: message });
    } else if (channel === 'sms') {
      result = await smsHelper.sendSMS({ to: recipient, message });
    } else if (channel === 'inapp') {
      // In‑app notifications may only require saving the record.
      result = { message: 'In-app notification logged.' };
    } else {
      throw new Error('Unsupported notification channel.');
    }
    
    notificationRecord.status = 'sent';
    notificationRecord.deliveredAt = new Date();
    await notificationRecord.save();
    return { success: true, notification: notificationRecord, result };
  } catch (error) {
    notificationRecord.status = 'failed';
    await notificationRecord.save();
    throw new Error('Notification sending failed: ' + error.message);
  }
};

/**
 * Schedules a notification for a future time by saving a record with a scheduledAt field.
 * A separate background job (not shown here) would process these scheduled notifications.
 */
exports.scheduleNotification = async (data) => {
  const { channel, recipient, subject, message, scheduledAt } = data;
  const notificationRecord = await Notification.create({
    channel,
    recipient,
    subject,
    message,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    status: 'pending'
  });
  return { success: true, scheduledNotification: notificationRecord };
};

/**
 * Marks an in-app notification as read or unread.
 */
exports.markInAppNotificationRead = async (notificationId, read) => {
  const notification = await Notification.findOne({ where: { id: notificationId } });
  if (!notification) {
    throw new Error('Notification not found.');
  }
  if (notification.channel !== 'inapp') {
    throw new Error('Only in-app notifications can be marked read.');
  }
  notification.read = read;
  await notification.save();
  return notification;
};

/**
 * Retrieves notification history with optional filtering (by recipient, channel, status).
 */
exports.getNotificationHistory = async (query) => {
  const where = {};
  if (query.recipient) {
    where.recipient = query.recipient;
  }
  if (query.channel) {
    where.channel = query.channel;
  }
  if (query.status) {
    where.status = query.status;
  }
  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });
  return notifications;
};
