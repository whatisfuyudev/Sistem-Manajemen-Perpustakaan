// routes/article.routes.js
const express = require('express');
const router  = express.Router();
const ArticleController = require('./articles.controller');
const authMiddleware   = require('../../middleware/auth.middleware');

// Public: fetch all published articles (with optional title filter, sorted oldest→newest)
router.get(
  '/published',
  ArticleController.listPublished
);

// Admin: search any articles by id/title/authorName
router.get(
  '/search',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticleController.searchAdmin
);

// Admin: create a new article
router.post(
  '/create',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticleController.createArticle
);

// Admin: edit an existing article
router.put(
  '/edit/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticleController.updateArticle
);

// Admin: Bulk‐delete articles
router.delete(
  '/delete',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticleController.bulkDeleteArticles
);

// Admin: publish/unpublish
router.put(
  '/:id/published',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticleController.setPublished
);

module.exports = router;
