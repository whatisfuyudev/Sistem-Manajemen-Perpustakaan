const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const checkoutPageController = require('./checkoutPage.controller');

// Route for rendering the admin checkout detail page (admin/librarian only)
router.get(
  '/admin/checkout/detail/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  checkoutPageController.renderAdminCheckoutDetail
);

// New “Add Checkout” page (Admin/Librarian only)
router.get(
  '/admin/checkout/add',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  checkoutPageController.renderAdminCheckoutAdd
);

// Route to render the "My Checkouts" page
router.get('/user/checkouts', authMiddleware.verifyToken, checkoutPageController.renderMyCheckouts);

module.exports = router;
