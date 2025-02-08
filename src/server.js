/**
 * server.js
 *
 * Entry point of the application.
 * Loads the Express app and starts the server.
 */

const app = require('./app');

// Load configuration settings (for example, your port number).
const config = require('./config/app.config');

// Determine the port to listen on (environment variable takes precedence)
const PORT = process.env.PORT || config.port || 5000;

app.listen(PORT, () => {
  console.log(`Library Web Application server is running on port ${PORT}`);
});
