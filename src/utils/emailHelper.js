// src/utils/emailHelper.js
require('dotenv/config');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
const User       = require('../models/user.model');
const Book       = require('../models/book.model');
const logger     = require('./logger');   // your Winston instance

const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

/**
 * Sends a raw email via MailerSend.
 * Always catches & logs errors so nothing ever throws.
 */
exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const sender = new Sender(
      process.env.EMAIL_FROM,
      process.env.EMAIL_FROM_NAME || "Library Notifications"
    );

    // normalize recipients
    let recipients = Array.isArray(to)
      ? to.map(e => new Recipient(e.trim()))
      : to.split(",").map(e => new Recipient(e.trim()));

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo(recipients)
      .setReplyTo(sender)
      .setSubject(subject)
      .setHtml(html)
      .setText(html.replace(/<[^>]+>/g, ''));

    const resp = await mailerSend.email.send(emailParams);
    logger.info(`Email sent to ${to}: ${subject}`);
    return resp;
  } catch (err) {
    // Log the full error stack, but do not throw
    logger.error("sendEmail failed", err);
    return null;
  }
};

/**
 * Notify a user when their reservation is available.
 * Errors are caught & logged internally.
 */
exports.sendReservationAvailableEmail = async (reservation) => {
  try {
    const user = await User.findByPk(reservation.userId);
    if (!user) {
      logger.error(`Reservation#${reservation.id}: user ${reservation.userId} not found.`);
      return null;
    }

    const book = await Book.findOne({ where: { isbn: reservation.bookIsbn } });
    if (!book) {
      logger.error(`Reservation#${reservation.id}: book ${reservation.bookIsbn} not found.`);
      return null;
    }

    const subject = 'Your Reserved Book is Now Available!';
    const html = `
      <p>Hi ${user.name || 'Patron'},</p>
      <p>Your reserved book <strong>“${book.title}”</strong> is now available for checkout.</p>
      <p>Thanks,<br/>Library App</p>
    `;

    return await exports.sendEmail({ to: user.email, subject, html });
  } catch (err) {
    logger.error(`sendReservationAvailableEmail failed for reservation#${reservation.id}`, err);
    return null;
  }
};

/**
 * Send a generic notification email.
 */
exports.sendNotificationEmail = async (notification) => {
  try {
    if (notification.channel !== 'email') {
      logger.warn(`Notification#${notification.id} skipped: channel is ${notification.channel}`);
      return null;
    }

    const html = `<div style="font-family:sans-serif">${notification.message}</div>`;
    return await exports.sendEmail({
      to:       notification.recipient,
      subject:  notification.subject || 'Library Notification',
      html
    });
  } catch (err) {
    logger.error(`sendNotificationEmail failed for notification#${notification.id}`, err);
    return null;
  }
};
