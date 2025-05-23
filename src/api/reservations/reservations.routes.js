// src/api/reservations/reservations.routes.js
const express = require('express');
const router = express.Router();
const reservationsController = require('./reservations.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Create a new reservation (user)
router.post('/reserve', authMiddleware.verifyToken, reservationsController.createReservation);

// Retrieve reservation history (supports query parameters for filtering) (admin/librarian)
router.get('/history', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reservationsController.getReservationHistory);

// New route for querying a user's own reservations (user)
router.get('/my', authMiddleware.verifyToken, reservationsController.getMyReservations);

// Cancel any existing reservation (user)
router.put('/cancel/:id', authMiddleware.verifyToken, reservationsController.cancelReservation);

// Modify existing reservation (user)
router.put('/modify/:id', authMiddleware.verifyToken, reservationsController.modifyReservation);

// Promote the next pending reservation for a book when available (admin/librarian)
router.put('/promote/:bookIsbn', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reservationsController.promoteNextReservation);

// Handle “Edit Reservation” form submission
router.put(
  '/admin/edit/:id',           // route path with :id param :contentReference[oaicite:4]{index=4}
  authMiddleware.verifyToken,                          // JWT verification middleware
  authMiddleware.isLibrarianOrAdmin,                   // role‑based guard
  reservationsController.updateAdminReservation          // controller action
);


module.exports = router;
