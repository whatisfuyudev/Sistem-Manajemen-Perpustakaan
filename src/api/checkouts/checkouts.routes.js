// src/api/checkouts/checkouts.routes.js
const express = require('express');
const router = express.Router();
const checkoutsController = require('./checkouts.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Initiate a new checkout
router.post('/checkout', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, checkoutsController.initiateCheckout);

// Process a return
router.post('/return', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, checkoutsController.processReturn);

// Retrieve checkout history (optionally filtered by query parameters)
router.get('/history', authMiddleware.verifyToken, checkoutsController.getCheckoutHistory);

// Handle “Edit Checkout” form submission
router.put(
  '/admin/checkout/edit/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  checkoutsController.updateAdminCheckout
);

// New endpoint for requesting a renewal
router.post('/request-renewal/:id', authMiddleware.verifyToken, checkoutsController.requestRenewal);

// Renew an active checkout
router.put('/renew/:id', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin,  checkoutsController.renewCheckout);


module.exports = router;
