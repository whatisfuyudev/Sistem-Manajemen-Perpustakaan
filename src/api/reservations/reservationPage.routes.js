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

// Render the “Promote Reservations” page
router.get(
  '/admin/reservations/promote',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  reservationPageController.renderAdminReservationPromote
);

// Render the “Reserve a Book” form (Admin/Librarian only)
router.get(
  '/admin/reservations/add',                // route path
  authMiddleware.verifyToken,                         
  authMiddleware.isLibrarianOrAdmin,                  // allow only staff
  reservationPageController.renderAdminReservationAdd
);

// New “Reservation Detail” page
router.get(
  '/admin/reservations/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  reservationPageController.renderReservationDetail
);

// Render the “Edit Reservation” form (Admin/Librarian only)
router.get(
  '/admin/reservations/edit/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  reservationPageController.renderAdminReservationEdit
);


module.exports = router;