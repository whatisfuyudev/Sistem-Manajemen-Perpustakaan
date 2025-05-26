// src/routes/admin-news.routes.js
const express = require('express');
const router = express.Router();
const auth    = require('../../middleware/auth.middleware');
const ctrl    = require('./newsPage.controller');

// Show the Add‑News form
router.get(
  '/admin/news/add',
  auth.verifyToken,
  auth.isLibrarianOrAdmin,
  ctrl.renderAddNewsPage
);

module.exports = router;