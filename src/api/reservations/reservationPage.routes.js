// In your routes file, e.g., userPage.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const reservationController = require('./reservationPage.controller');

router.get('/user/reservations', authMiddleware.verifyToken, reservationController.renderMyReservationsPage);

module.exports = router;