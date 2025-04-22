// In your routes file, e.g., userPage.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const userController = require('./userPage.controller');

router.get(
  '/profile', 
  authMiddleware.verifyToken, 
  userController.renderProfilePage
);

// Render the Admin User Detail page (Admin/Librarian only)
router.get(
  '/admin/users/:id',                   // route path with :id parameter
  authMiddleware.verifyToken,           // ensure a valid JWT
  authMiddleware.isAdmin,    // allow only Admin roles
  userController.renderAdminUserDetail  // controller to fetch & render
);

// Render the Admin “Edit User” page
router.get(
  '/admin/users/edit/:id',          // URL with :id parameter :contentReference[oaicite:0]{index=0}
  authMiddleware.verifyToken,       // require valid JWT
  authMiddleware.isAdmin,           // only Admins allowed
  userController.renderAdminUserEdit
);

module.exports = router;
