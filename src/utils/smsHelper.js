// use twilio free trial account

// src/utils/smsHelper.js
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendSMS = async ({ to, message }) => {
  const msg = await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER, // your Twilio phone number
    to, // recipient's phone number
  });
  console.log("SMS sent: %s", msg.sid);
  return msg;
};
