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
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth.middleware');
// importing it so it runs even if the variable is not used
const overdueChecker = require('./utils/checkoutOverdueChecker'); 
const expiredChecker = require('./utils/reservationExpiredChecker');

const app = express();

// Load Postgresql database
const sequelize = require('./utils/db');

// Sync all models at once
sequelize
  .sync({ alter: true }) 
  .then(() => console.log("Database & tables synchronized"))
  .catch((err) => console.error("Error syncing database:", err));

// Load environment variables from a .env file into process.env
require('dotenv').config();


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

// For cookie parsing
app.use(cookieParser());

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

// Mount authentication routes
const authRoutes = require('./api/auth/auth.routes');
app.use('/api/auth', authRoutes);

// Mount checkout routes
const checkoutRoutes = require('./api/checkouts/checkouts.routes');
app.use('/api/checkouts', checkoutRoutes);

// Mount reservation routes
const reservationRoutes = require('./api/reservations/reservations.routes');
app.use('/api/reservations', reservationRoutes);

// Mount report routes
const reportRoutes = require('./api/reports/reports.routes');
app.use('/api/reports', reportRoutes);

// Optionally, you can define a route for the homepage (if it’s static).
// This example sends the static index.html from the public folder.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'homepage.html'));
});

app.get('/books/delete', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'deleteBook.html'));
});

app.get('/books/update', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'updateBook.html'));
});

app.get('/books/add', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'createBook.html'));
});

app.get('/users/create', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'createUser.html'));
});

app.get('/users/update', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'updateUser.html'));
});

app.get('/users/delete', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'deleteUser.html'));
});

app.get('/auth/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/profile', authMiddleware.verifyToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'profile.html'));
});

app.get('/admin/checkouts/create', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'createCheckout.html'));
});

app.get('/admin/checkouts/return', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'returnCheckout.html'));
});

app.get('/admin/checkouts/renew', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'renewCheckout.html'));
});

app.get('/admin/checkouts/history', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'checkoutHistory.html'));
});

app.get('/reservations/create', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'createReservation.html'));
});

app.get('/reservations/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'cancelReservation.html'));
});

app.get('/reservations/modify', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'modifyReservation.html'));
});

app.get('/admin/reservations/promote', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'promoteReservation.html'));
});

app.get('/admin/reservations/history', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'reservationHistory.html'));
});

app.get('/admin/reports', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'report.html'));
});

// // --------------------
// // Global Error Handling
// // --------------------
// // Import a custom error-handling middleware to catch and process errors.
// const errorHandler = require('./middleware/error.middleware');
// app.use(errorHandler);

module.exports = app;
