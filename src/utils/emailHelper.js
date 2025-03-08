// src/utils/emailHelper.js
require('dotenv/config');
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");
// Import models (adjust paths as needed)
const User = require('../models/user.model');
const Book = require('../models/book.model');


// Initialize MailerSend with your API key
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

/**
 * Sends an email using MailerSend.
 * @param {Object} options - Email options
 * @param {string|string[]} options.to - Recipient email(s). Can be a comma-separated string.
 * @param {string} options.subject - Email subject.
 * @param {string} options.html - HTML content of the email.
 */
exports.sendEmail = async ({ to, subject, html }) => {
  // Create a sender instance from environment variables
  const sender = new Sender(process.env.EMAIL_FROM, process.env.EMAIL_FROM_NAME || "Library Notifications");

  // Normalize recipients: if a string, split by commas; if an array, use as-is.
  let recipients = [];
  if (Array.isArray(to)) {
    recipients = to.map(email => new Recipient(email.trim()));
  } else {
    const emails = to.split(",").map(email => email.trim()).filter(email => email);
    recipients = emails.map(email => new Recipient(email));
  }

  // Build email parameters
  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setReplyTo(sender)
    .setSubject(subject)
    .setHtml(html)
    .setText(html.replace(/<[^>]+>/g, '')); // generate plain text by stripping HTML tags

  try {
    const response = await mailerSend.email.send(emailParams);
    console.log("Email sent:", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Notification sending failed: " + error.message);
  }
};

// New function to send a reservation availability email
exports.sendReservationAvailableEmail = async (reservation) => {

  // Retrieve user data based on reservation.userId
  const user = await User.findOne({ where: { id: reservation.userId } });
  if (!user) {
    throw new Error('User not found for reservation.');
  }
  
  // Retrieve book data based on reservation.bookIsbn
  const book = await Book.findOne({ where: { isbn: reservation.bookIsbn } });
  if (!book) {
    throw new Error('Book not found for reservation.');
  }
  
  // Use library name from environment variable or fallback value
  const libraryName = 'Library App';
  const subject = 'Your Reserved Book is Now Available!';
  const html = `
    <p>Hi ${user.name || 'Patron'},</p>
    <p>Good news—your reserved book, “${book.title}”, is now available for checkout. Please visit the library to borrow it.</p>
    <p>Thank you,<br>${libraryName}</p>
  `;
  
  // Send email using the sendEmail function
  return await exports.sendEmail({ to: user.email, subject, html });
};
