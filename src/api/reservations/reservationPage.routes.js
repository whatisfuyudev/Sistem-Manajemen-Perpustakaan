// In your routes file, e.g., userPage.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const reservationPageController = require('./reservationPage.controller');

// Existing “My Reservations” page
router.get(
  '/user/reservations',
  authMiddleware.verifyToken,
  reservationPageController.renderMyReservationsPage
);

// New “Reservation Detail” page
router.get(
  '/admin/reservations/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  reservationPageController.renderReservationDetail
);

module.exports = router;