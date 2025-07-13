// src/middleware/error.middleware.js
// const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    // Log the error details internally
    // logger.error(err);

    // Set an appropriate HTTP status code (default to 500 for internal errors)
    const statusCode = err.status || 500;

    // Send a generic error message to the client
    const errorMessage = statusCode === 500
        ? 'Internal server error.'
        : err.message;

    res.status(statusCode).json({ message: errorMessage });
};
  