// src/middleware/logging.middleware.js
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const authConfig = require('../config/auth.config');

// Define a custom token that returns the IP address
morgan.token('remote-ip', (req) => {
  return req.ip;
});

// Define a custom token that extracts and decodes the JWT cookie
morgan.token('user', (req) => {
  // Ensure cookie-parser middleware is used so that req.cookies is populated
  const token = req.cookies ? req.cookies.jwt_token : null;
  if (!token) {
    return 'No user';
  }
  try {
    const decoded = jwt.verify(token, authConfig.secret);
    // Return user id and role
    return `UserID: ${decoded.id}, Role: ${decoded.role}`;
  } catch (error) {
    return 'Invalid token';
  }
});

// Create a format string that includes the custom tokens
const formatString = ':remote-ip - :method :url :status :res[content-length] - :response-time ms - :user';

// Define a stream object for Morgan that passes the formatted message to Winston
const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Export the Morgan middleware configured with our format string and stream
module.exports = morgan(formatString, { stream: morganStream });
