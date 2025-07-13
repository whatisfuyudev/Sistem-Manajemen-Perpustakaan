// // src/utils/logger.js
// const { createLogger, format, transports } = require('winston');
// const { combine, timestamp, printf, errors } = format;

// // Define a custom log format
// const logFormat = printf(({ level, message, timestamp, stack, ip }) => {
//     const ipInfo = ip ? `[ip: ${ip}] ` : '';
//     return `${timestamp} ${level}: ${ipInfo}${stack || message}`;
//   });

// const logger = createLogger({
//   level: 'info', // Minimum level to log (can be configured per environment)
//   format: combine(
//     timestamp(),
//     errors({ stack: true }), // include stack trace if error object
//     logFormat
//   ),
//   transports: [
//     // Log to the console
//     new transports.Console(),
//     // Log to a file; you can use additional transports or configure rotation using a library like winston-daily-rotate-file
//     new transports.File({ filename: 'logs/combined.log' }),
//     new transports.File({ filename: 'logs/error.log', level: 'error' })
//   ]
// });

// module.exports = logger;
