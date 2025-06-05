// src/routes/admin-news.routes.js
const express = require('express');
const router = express.Router();
const auth    = require('../../middleware/auth.middleware');
const ctrl    = require('./newsPage.controller');

router.get(
  "/news/:id",
  ctrl.renderNewsPage
);

// Show the Add‑News form
router.get(
  '/admin/news/add',
  auth.verifyToken,
  auth.isLibrarianOrAdmin,
  ctrl.renderAddNewsPage
);

router.get(
  '/admin/news/:id',
  auth.verifyToken,
  auth.isLibrarianOrAdmin,
  ctrl.renderAdminNewsDetailPage
);

router.get(
  '/admin/news/edit/:id',
  auth.verifyToken,
  auth.isLibrarianOrAdmin,
  ctrl.renderAdminNewsEditPage
);

module.exports = router;