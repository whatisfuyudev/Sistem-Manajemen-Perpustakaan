// src/utils/emailHelper.js
const nodemailer = require('nodemailer');

exports.sendEmail = async ({ to, subject, html }) => {
  // Create a transporter using your email service settings
  // For example, using Gmail's SMTP or any other provider.
  // For a production system, replace these with your real credentials.
  let transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,          // e.g., "smtp.gmail.com"
    port: process.env.EMAIL_PORT,          // e.g., 465 for secure
    secure: process.env.EMAIL_SECURE === 'true', // true if port is 465
    auth: {
      user: process.env.EMAIL_USER,        // your email address
      pass: process.env.EMAIL_PASS         // your email password or app password
    }
  });

  // Send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"Library Notifications" <${process.env.EMAIL_FROM}>`, // sender address
    to, // recipient address
    subject, // Subject line
    html, // HTML body content
  });

  console.log("Email sent: %s", info.messageId);
  return info;
};
