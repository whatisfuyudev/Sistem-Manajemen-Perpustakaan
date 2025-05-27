const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const dataHelper = require('../../utils/dataHelper');
const authMiddleware = require('../../middleware/auth.middleware');

/*
ENDPOINTS FOR CLIENTS/USER?
*/

// Get a single user by id from jwt token
router.get('/single', authMiddleware.verifyToken, userController.getUserById);

// Update a user by id from jwt token
router.put('/update', authMiddleware.verifyToken, userController.updateUser);

// Handle updating cover image
router.post('/upload/profile-picture', authMiddleware.verifyToken, dataHelper.upload, userController.handleProfilePictureUpload);

/*
ENDPOINTS FOR ADMINS?
*/
// Create a new user (for admin)
router.post(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin, 
  userController.createUser
);

// Get all users (for admin)
router.get(
  '/',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.getAllUsers
);

// New Endpoint to get single user by their id (admin only)
router.get(
  '/:id', 
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.getUserByIdAdmin
);

// New Endpoint to update a user by their id (admin only)
router.put('/:id',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.updateUserAdmin
);

// Delete a user by id (admin only)
router.delete('/:id',
  authMiddleware.verifyToken,
  authMiddleware.isAdmin,
  userController.deleteUser
);

module.exports = router;
