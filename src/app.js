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

// Load Postgresql database
const sequelize = require('./utils/db');
const Book = require('./models/book.model');

// Sync all models at once
sequelize
  .sync({ alter: true }) 
  .then(() => console.log("Database & tables synchronized"))
  .catch((err) => console.error("Error syncing database:", err));

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
app.use('/public', express.static(path.join(__dirname, '../public')));

// --------------------
// Routes
// --------------------
// Import and mount your API routes. In this example, we assume you have an index file
// in the "api" directory that aggregates all your feature-specific routes.
const booksRoutes = require('./api/books/books.routes');
app.use('/api/books', booksRoutes);

const userRoutes = require('./api/users/users.routes');
app.use('/api/users', userRoutes);


// Optionally, you can define a route for the homepage (if it’s static).
// This example sends the static index.html from the public folder.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'deleteBook.html'));
});

app.get('/books/add', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'createBook.html'));
});

app.get('/users/create', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'createUser.html'));
});

// // --------------------
// // Global Error Handling
// // --------------------
// // Import a custom error-handling middleware to catch and process errors.
// const errorHandler = require('./middleware/error.middleware');
// app.use(errorHandler);

module.exports = app;
