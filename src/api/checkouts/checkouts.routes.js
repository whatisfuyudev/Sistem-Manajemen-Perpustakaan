// src/api/checkouts/checkouts.routes.js
const express = require('express');
const router = express.Router();
const checkoutsController = require('./checkouts.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Initiate a new checkout
router.post('/checkout', checkoutsController.initiateCheckout);

// Process a return
router.post('/return', checkoutsController.processReturn);

// New endpoint for requesting a renewal
router.post('/request-renewal/:id', authMiddleware.verifyToken, checkoutsController.requestRenewal);

// Renew an active checkout
router.put('/renew/:id', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin,  checkoutsController.renewCheckout);

// Retrieve checkout history (optionally filtered by query parameters)
router.get('/history', authMiddleware.verifyToken, checkoutsController.getCheckoutHistory);

module.exports = router;
