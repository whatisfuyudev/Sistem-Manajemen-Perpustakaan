// src/api/notifications/notifications.service.js
const Notification = require('../../models/notification.model');
const emailHelper = require('../../utils/emailHelper');
const smsHelper = require('../../utils/smsHelper');
const CustomError = require('../../utils/customError');
const { Op } = require('sequelize');

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
      result = await emailHelper.sendEmail({
        to: recipient,
        subject,
        html: message
      });
    } else if (channel === 'sms') {
      result = await smsHelper.sendSMS({ to: recipient, message });
    } else if (channel === 'inapp') {
      // For in-app notifications, only a record is saved.
      result = { message: 'In-app notification logged.' };
    } else {
      throw new CustomError('Unsupported notification channel.', 400);
    }
    
    // Update record status on success
    notificationRecord.status = 'sent';
    notificationRecord.deliveredAt = new Date();
    await notificationRecord.save();
    return { success: true, notification: notificationRecord, result };
  } catch (error) {
    notificationRecord.status = 'failed';
    await notificationRecord.save();
    
    // Improved error handling: if error.message is undefined, output the full error object
    const errMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
    throw new CustomError('Notification sending failed: ' + errMsg, 500);
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
    throw new CustomError('Notification not found.', 404);
  }
  if (notification.channel !== 'inapp') {
    throw new CustomError('Only in-app notifications can be marked read.', 400);
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

  // Exact-match enums & boolean
  if (query.channel)  where.channel = query.channel;
  if (query.status)   where.status  = query.status;
  if (query.read != null) {
    // convert string "true"/"false" to boolean
    where.read = query.read === 'true';
  }

  // Partial/text search (case-insensitive)
  if (query.recipient) where.recipient = { [Op.iLike]: `%${query.recipient}%` };
  if (query.subject)   where.subject   = { [Op.iLike]: `%${query.subject}%`   };
  if (query.message)   where.message   = { [Op.iLike]: `%${query.message}%`   };

  // Dynamic date-range filtering
  // Default to createdAt if no dateField provided
  const field = ['createdAt','scheduledAt','deliveredAt']
    .includes(query.dateField)
      ? query.dateField
      : 'createdAt';

  const { startDate, endDate } = query;
  if (startDate || endDate) {
    where[field] = {};
    if (startDate) {
      const sd = new Date(startDate);
      if (!isNaN(sd)) where[field][Op.gte] = sd;
    }
    if (endDate) {{

    }
      const ed = new Date(endDate);
      if (!isNaN(ed)) where[field][Op.lte] = ed;
    }
  }

  // Fetch & return
  const notifications = await Notification.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });

  return notifications;
};
