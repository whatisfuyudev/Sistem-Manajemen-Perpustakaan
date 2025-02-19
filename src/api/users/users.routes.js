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

/*
ENDPOINTS FOR ADMINS?
*/
// Create a new user (e.g., registration)
router.post('/', dataHelper.upload, userController.createUser);

// Handle updating cover image
router.post('/upload/profile-picture', dataHelper.upload, userController.handleProfilePictureUpload);

// Get all users (for admin/librarian)
router.get('/', userController.getAllUsers);

// New Endpoint to get single user by their id (admin/librarian only)

// New Endpoint to update a user by their id (admin/librarian only)

// Delete a user by id
router.delete('/:id', userController.deleteUser);

module.exports = router;
