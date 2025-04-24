// In your routes file, e.g., userPage.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const userPageController = require('./userPage.controller');

router.get(
  '/profile', 
  authMiddleware.verifyToken, 
  userPageController.renderProfilePage
);

// Render the “Add New User” page (Admin only)
router.get(
  '/admin/panel/users/add',                   // route path
  authMiddleware.verifyToken,           // require valid JWT
  authMiddleware.isAdmin,               // only Admins allowed
  userPageController.renderAdminUserAdd // controller to render the EJS
);

// Render the Admin User Detail page (Admin/Librarian only)
router.get(
  '/admin/users/:id',                   // route path with :id parameter
  authMiddleware.verifyToken,           // ensure a valid JWT
  authMiddleware.isAdmin,    // allow only Admin roles
  userPageController.renderAdminUserDetail  // controller to fetch & render
);

// Render the Admin “Edit User” page
router.get(
  '/admin/users/edit/:id',          // URL with :id parameter :contentReference[oaicite:0]{index=0}
  authMiddleware.verifyToken,       // require valid JWT
  authMiddleware.isAdmin,           // only Admins allowed
  userPageController.renderAdminUserEdit
);

module.exports = router;
