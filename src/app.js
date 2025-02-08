/**
 * app.js
 *
 * Sets up the Express application:
 *  - Configures middleware for security, logging, and request parsing.
 *  - Serves static assets from the public directory (e.g., static HTML pages).
 *  - Mounts the API routes (e.g., for authentication, user management, catalog, circulation, etc.).
 *  - Applies global error handling.
 */

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Load application configuration (if you have one)
// For example, you might have a config file at ./config/app.config.js
const config = require('./config/app.config');

// --------------------
// Middleware Setup
// --------------------

// Set security-related HTTP headers
app.use(helmet());

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded payloads (for form submissions, etc.)
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (using the 'combined' Apache format)
app.use(morgan('combined'));

// --------------------
// Static Files
// --------------------
// Serve static assets (HTML, CSS, JS, images, etc.) from the 'public' directory.
// For example, if you have a homepage (index.html) or a login page as static HTML.
app.use(express.static(path.join(__dirname, 'public')));

// --------------------
// Routes
// --------------------
// Import and mount your API routes. In this example, we assume you have an index file
// in the "api" directory that aggregates all your feature-specific routes.
const apiRoutes = require('./api');
app.use('/api', apiRoutes);

// Optionally, you can define a route for the homepage (if it’s static).
// This example sends the static index.html from the public folder.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --------------------
// Global Error Handling
// --------------------
// Import a custom error-handling middleware to catch and process errors.
const errorHandler = require('./middleware/error.middleware');
app.use(errorHandler);

module.exports = app;
