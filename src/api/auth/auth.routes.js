const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

// POST /api/auth/register - User registration
router.post('/register', authController.register);

// POST /api/auth/login - User login
router.post('/login', authController.login);

// POST /api/auth/logout - Endpoint for logging out
router.post('/logout', authController.logout);

// Optional: Additional endpoints like password reset could be added here

module.exports = router;
