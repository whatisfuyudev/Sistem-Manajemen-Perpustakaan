// In your routes file, e.g., userPage.routes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const userController = require('./userPage.controller');

router.get('/profile', authMiddleware.verifyToken, userController.renderProfilePage);

module.exports = router;
