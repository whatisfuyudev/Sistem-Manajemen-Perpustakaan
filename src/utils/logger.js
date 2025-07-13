// src/utils/logger.js
const fs        = require('fs');
const path      = require('path');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, errors } = format;

// 1. Determine project root (adjust the number of ../ as needed)
const projectRoot = path.resolve(__dirname, '../..');

// 2. Build & create the logs directory
const logDir = path.join(projectRoot, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 3. Define a custom log format
const logFormat = printf(({ level, message, timestamp, stack, ip }) => {
  const ipInfo = ip ? `[ip: ${ip}] ` : '';
  return `${timestamp} ${level}: ${ipInfo}${stack || message}`;
});

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    errors({ stack: true }), // include stack trace
    logFormat
  ),
  transports: [
    // ⏺ Console
    new transports.Console(),

    // ⏺ Combined (all levels)  
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),

    // ⏺ Errors only  
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
  ],
});

module.exports = logger;
