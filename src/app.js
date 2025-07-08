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
const { rateLimit }   = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const authMiddleware = require('./middleware/auth.middleware');
// importing it so it runs even if the variable is not used
const combinedScheduler = require('./utils/combinedScheduler'); 
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

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],

      // Allow self and jsDelivr for scripts
      scriptSrc: [
        "'self'",
        'https://cdn.jsdelivr.net'
      ],

      // (optional) allow other origins as needed
      styleSrc: [
        "'unsafe-inline'", 
        "'self'", 
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      imgSrc:   ["'self'", 'https://res.cloudinary.com', 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"]
    }
  })
);

// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 100, // 1 minutes window
  max: 100, // max 100 request per window
  keyGenerator: (req) => {
    // e.g. after your auth middleware sets req.user.id
    // key either from user id or ip address
    return req.user?.id || req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// turn of rate limiting because the server host the image locally 
// instead of on some cloud platform like aws s3/firebase/etc.
// this makes the request for each user really high and will hit the rate limit
// very quickly. if rate limiter want to be turned on, consider storing images
// on firebase or s3 or some sort of free static asset hosting platform.
// app.use(globalLimiter);


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

// Mount news routes
const newsRoutes = require('./api/news/news.routes');
app.use('/api/news', newsRoutes);

// Mount articles routes
const articlesRoutes = require('./api/articles/articles.routes');
app.use('/api/articles', articlesRoutes);

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

// Mount the new notification page route
const notificationPageRoutes = require('./api/notifications/notificationPage.routes');
app.use('/', notificationPageRoutes);

// Mount the new news page route
const newsPageRoutes = require('./api/news/newsPage.routes');
app.use('/', newsPageRoutes);

// Mount the new articles page route
const articlesPageRoutes = require('./api/articles/articlesPage.routes');
app.use('/', articlesPageRoutes);


// Optionally, you can define a route for the homepage (if it’s static).
// This example sends the static index.html from the public folder.
app.get(
  '/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'homepage.html'));
  }
);

app.get('/auth/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'register.html'));
});

app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.get('/admin/panel', 
  authMiddleware.verifyToken, 
  authMiddleware.isLibrarianOrAdmin, 
  (req, res) => {
    // Render the edit form, passing the existing data
    res.render('admin-panel');
});

// // --------------------
// // Global Error Handling
// // --------------------
// Place error-handling middleware as the last middleware
const errorMiddleware = require('./middleware/error.middleware');
app.use(errorMiddleware);


// Catch‑all 404 handler
app.use((req, res, next) => {
  res.status(404);
  // using EJS
  res.render('404');
});

module.exports = app;
