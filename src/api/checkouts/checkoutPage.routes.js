const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const checkoutPageController = require('./checkoutPage.controller');

// Route to render the "My Checkouts" page
router.get('/user/checkouts', authMiddleware.verifyToken, checkoutPageController.renderMyCheckouts);

// New “Add Checkout” page (Admin/Librarian only)
router.get(
  '/admin/checkout/add',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  checkoutPageController.renderAdminCheckoutAdd
);

// Route for rendering the admin checkout detail page (admin/librarian only)
router.get(
  '/admin/checkout/detail/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  checkoutPageController.renderAdminCheckoutDetail
);

// Render the “Edit Checkout” form
router.get(
  '/admin/checkout/edit/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  checkoutPageController.renderAdminCheckoutEdit
);



module.exports = router;
