const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const checkoutPageController = require('./checkoutPage.controller');

// Route to render the "My Checkouts" page
router.get('/user/checkouts', authMiddleware.verifyToken, checkoutPageController.renderMyCheckouts);

module.exports = router;
