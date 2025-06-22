// src/api/notifications/notifications.service.js
const Notification = require('../../models/notification.model');
const emailHelper = require('../../utils/emailHelper');
const smsHelper = require('../../utils/smsHelper');
const CustomError = require('../../utils/customError');
const { Op } = require('sequelize');

// /**
//  * Sends a notification via the specified channel.
//  * Saves a pending notification record, sends the message, and updates the record status.
//  */
// exports.sendNotification = async (data) => {
//   const { channel, recipient, subject, message } = data;
  
//   // Create a pending notification record
//   const notificationRecord = await Notification.create({
//     channel,
//     recipient,
//     subject,
//     message,
//     status: 'pending'
//   });
  
//   try {
//     let result;
//     if (channel === 'email') {
//       result = await emailHelper.sendEmail({
//         to: recipient,
//         subject,
//         html: message
//       });
    // } else if (channel === 'sms') {
    //   // Feature not implemented yet
    //   throw new CustomError('SMS notifications are coming soon.', 501);
    //   // result = await smsHelper.sendSMS({ to: recipient, message });
    // } else {
    //   throw new CustomError('Unsupported notification channel.', 400);
    // }
    
//     // Update record status on success
//     notificationRecord.status = 'sent';
//     notificationRecord.deliveredAt = new Date();
//     await notificationRecord.save();
    
//     if(!result) {
//       return { success: false, notification: notificationRecord, result };
//     } 
//     return { success: true, notification: notificationRecord, result };
//   } catch (error) {
//     notificationRecord.status = 'failed';
//     await notificationRecord.save();
    
//     // Improved error handling: if error.message is undefined, output the full error object
//     const errMsg = error.message || (typeof error === 'object' ? JSON.stringify(error) : error.toString());
//     throw new CustomError('Notification sending failed: ' + errMsg, 500);
//   }
// };

exports.sendNotification = async (data) => {
  const { channel, recipients, subject, message } = data;

  // create *one* Notification record per address and send each
  const results = await Promise.all(
    recipients.map(async to => {
      if (channel === 'email') {
        // record pending
        const record = await Notification.create({ channel, recipient: to, subject, message, status: 'pending' });
        try {
          await emailHelper.sendEmail({ to, subject, html: message });
          record.status = 'sent';
          record.deliveredAt = new Date();
          await record.save();
          return { to, success: true };
        } catch (err) {
          record.status = 'failed';
          await record.save();
          return { to, success: false, error: err.message };
        }
      }
      else if (channel === 'sms') {
        // Feature not implemented yet
        throw new CustomError('SMS notifications are coming soon.', 501);
        // result = await smsHelper.sendSMS({ to: recipient, message });
      } 
      else {
        throw new CustomError('Unsupported notification channel.', 400);
      }
    })
  );

  // overall success if _all_ succeeded, or partial if some failed
  const success = results.every(r => r.success);
  return { success, results };
};

// /**
//  * Schedules a notification for a future time by saving a record with a scheduledAt field.
//  * A separate background job (not shown here) would process these scheduled notifications.
//  */
// exports.scheduleNotification = async (data) => {
//   const { channel, recipient, subject, message, scheduledAt } = data;

//   if (channel === 'sms') {
//     throw new CustomError('SMS scheduling is coming soon.', 501);
//   }

//   const notificationRecord = await Notification.create({
//     channel,
//     recipient,
//     subject,
//     message,
//     // if the client passed scheduledAt → use it; otherwise default to now
//     scheduledAt: scheduledAt
//       ? new Date(scheduledAt)
//       : new Date(),
//     status: 'pending'
//   });
//   return { success: true, scheduledNotification: notificationRecord };
// };

// src/api/notifications/notifications.service.js

exports.scheduleNotification = async (data) => {
  const { channel, recipients, subject, message, scheduledAt } = data;

  if (channel === 'sms') {
    throw new CustomError('SMS scheduling is coming soon.', 501);
  }

  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new CustomError('Must supply at least one recipient.', 400);
  }

  // Create one pending record per recipient
  const records = await Promise.all(
    recipients.map(async (to) => {
      return Notification.create({
        channel,
        recipient:    to,
        subject,
        message,
        scheduledAt:  scheduledAt ? new Date(scheduledAt) : new Date(),
        status:       'pending'
      });
    })
  );

  return {
    success: true,
    scheduledNotifications: records   // array of Sequelize instances
  };
};

/**
 * Retrieves notification history with optional filtering (by recipient, channel, status).
 */
exports.getNotificationHistory = async (query) => {
  // 1) Pull pagination + filters from query
  const {
    page = 1,
    limit = 10,
    id,
    channel,
    status,
    read,
    recipient,
    subject,
    message,
    dateField,
    startDate,
    endDate
  } = query;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  // 2) Build WHERE clause
  const where = {};

  // exact‐match fields
  if (id) where.id = id;
  if (channel) where.channel = channel;
  if (status)  where.status  = status;
  if (read != null) where.read = (read === 'true');

  // partial text
  if (recipient) where.recipient = { [Op.iLike]: `%${recipient}%` };
  if (subject)   where.subject   = { [Op.iLike]: `%${subject}%`   };
  if (message)   where.message   = { [Op.iLike]: `%${message}%`   };

  // date range on chosen field
  const df = ['createdAt','scheduled_at','delivered_at'].includes(dateField)
    ? dateField
    : 'createdAt';

  if (startDate || endDate) {
    where[df] = {};
    if (startDate) {
      const sd = new Date(startDate);
      if (!isNaN(sd)) where[df][Op.gte] = sd;
    }
    if (endDate) {
      const ed = new Date(endDate);
      if (!isNaN(ed)) where[df][Op.lte] = ed;
    }
  }

  // 3) Query with count + rows
  const { count, rows } = await Notification.findAndCountAll({
    where,
    offset,
    limit: parseInt(limit, 10),
    order: [['id', 'DESC']]
  });

  // 4) Return in standardized shape
  return {
    total: count,
    notifications: rows,
    page: parseInt(page, 10)
  };
};

exports.updateNotification = async (id, data) => {
  // 1) Fetch existing record
  const notification = await Notification.findByPk(id);
  if (!notification) {
    throw new CustomError('Notification not found', 404);
  }

  // 2) Apply changes
  //   - If scheduledAt is present, convert to Date
  if (data.scheduledAt !== undefined) {
    const dt = new Date(data.scheduledAt);
    if (isNaN(dt)) throw new CustomError('Invalid scheduledAt date', 400);
    notification.scheduledAt = dt;
    delete data.scheduledAt;
  }
  //   - other fields directly
  Object.keys(data).forEach(key => {
    notification[key] = data[key];
  });

  // 3) Save
  await notification.save();  // instance.save() only writes changed fields :contentReference[oaicite:2]{index=2}

  // 4) Return fresh instance
  return notification;
};
