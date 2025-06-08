// routes/admin.article.routes.js
const express = require('express');
const router  = express.Router();
const ArticlePageController = require('./articlesPage.controller');
const authMiddleware        = require('../../middleware/auth.middleware');

// Add (blank) form
router.get(
  '/admin/articles/add',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticlePageController.renderAddForm
);

// Edit (prefill) form
router.get(
  '/admin/articles/edit/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticlePageController.renderEditForm
);

router.get(
  '/admin/articles/:id', 
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticlePageController.viewArticle
);

router.get(
  '/articles/:id', 
  ArticlePageController.viewPublishedArticle
);



module.exports = router;

