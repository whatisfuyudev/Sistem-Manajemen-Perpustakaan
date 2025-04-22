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
const path = require('path');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth.middleware');
// importing it so it runs even if the variable is not used
const overdueChecker = require('./utils/checkoutOverdueChecker'); 
const expiredChecker = require('./utils/reservationExpiredChecker');

const loggerMiddleware = require('./middleware/logging.middleware'); // our Morgan configured with Winston

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

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

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

// For cookie parsing
app.use(cookieParser());

// Use the logging middleware
app.use(loggerMiddleware);

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

// Mount notification routes
const notificationRoutes = require('./api/notifications/notifications.routes');
app.use('/api/notifications', notificationRoutes);

// Mount the new book page route
const bookPageRoutes = require('./api/books/bookPage.routes');
app.use('/', bookPageRoutes);

// Mount the new user page route
const userPageRoutes = require('./api/users/userPage.routes');
app.use('/', userPageRoutes);

// Mount the new reservation page route
const reservationPageRoutes = require('./api/reservations/reservationPage.routes');
app.use('/', reservationPageRoutes);

// Mount the new checkout page route
const checkoutPageRoutes = require('./api/checkouts/checkoutPage.routes');
app.use('/', checkoutPageRoutes);

// Optionally, you can define a route for the homepage (if it’s static).
// This example sends the static index.html from the public folder.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'homepage.html'));
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

app.get('/admin/notifications', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'notification.html'));
});

app.get('/admin/reports', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'report.html'));
});

app.get('/admin/panel', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
    // Render the edit form, passing the existing data
    res.render('admin-panel');
});

// testing, move elsewhere after finishing it
app.get('/test/search', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'testSearchbar.html'));
});


// // --------------------
// // Global Error Handling
// // --------------------
// Place error-handling middleware as the last middleware
const errorMiddleware = require('./middleware/error.middleware');
app.use(errorMiddleware);

module.exports = app;
