// src/api/checkouts/checkouts.routes.js
const express = require('express');
const router = express.Router();
const checkoutsController = require('./checkouts.controller');

// Initiate a new checkout
router.post('/checkout', checkoutsController.initiateCheckout);

// Process a return
router.post('/return', checkoutsController.processReturn);

// Renew an active checkout
router.put('/renew/:id', checkoutsController.renewCheckout);

// Retrieve checkout history (optionally filtered by query parameters)
router.get('/history', checkoutsController.getCheckoutHistory);

module.exports = router;
