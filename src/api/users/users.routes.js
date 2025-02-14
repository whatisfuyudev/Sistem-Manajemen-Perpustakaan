const express = require('express');
const router = express.Router();
const userController = require('./users.controller');

// Create a new user (e.g., registration)
router.post('/', userController.createUser);

// Get all users (for admin/librarian)
router.get('/', userController.getAllUsers);

// Get a single user by id
router.get('/:id', userController.getUserById);

// Update a user by id
router.put('/:id', userController.updateUser);

// Delete a user by id
router.delete('/:id', userController.deleteUser);

module.exports = router;
