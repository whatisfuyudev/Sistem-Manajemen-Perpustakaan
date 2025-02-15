const express = require('express');
const router = express.Router();
const userController = require('./users.controller');
const dataHelper = require('../../utils/dataHelper');

// Create a new user (e.g., registration)
router.post('/', dataHelper.upload, userController.createUser);

// Handle updating cover image
router.post('/upload/profile-picture', dataHelper.upload, userController.handleProfilePictureUpload);

// Get all users (for admin/librarian)
router.get('/', userController.getAllUsers);

// Get a single user by id
router.get('/:id', userController.getUserById);

// Update a user by id
router.put('/:id', userController.updateUser);

// Delete a user by id
router.delete('/:id', userController.deleteUser);

module.exports = router;
