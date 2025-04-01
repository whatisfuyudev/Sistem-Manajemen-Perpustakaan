// src/api/reservations/reservations.routes.js
const express = require('express');
const router = express.Router();
const reservationsController = require('./reservations.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Create a new reservation
router.post('/reserve', authMiddleware.verifyToken, reservationsController.createReservation);

// Cancel an existing reservation
router.put('/cancel/:id', reservationsController.cancelReservation);

// Modify reservation details (e.g., notes)
router.put('/modify/:id', reservationsController.modifyReservation);

// Promote the next pending reservation for a book when available
router.put('/promote/:bookIsbn', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reservationsController.promoteNextReservation);

// Retrieve reservation history (supports query parameters for filtering)
router.get('/history', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin,reservationsController.getReservationHistory);

// New route for querying a user's own reservations
router.get('/my', authMiddleware.verifyToken, reservationsController.getMyReservations);

module.exports = router;
