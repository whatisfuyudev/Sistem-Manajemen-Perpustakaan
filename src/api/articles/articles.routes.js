// routes/article.routes.js
const express = require('express');
const router  = express.Router();
const ArticleController = require('./articles.controller');
const authMiddleware   = require('../../middleware/auth.middleware');
const dataHelper = require('../../utils/dataHelper');

// Public: fetch all published articles (with optional title filter, sorted oldest→newest)
router.get(
  '/published',
  ArticleController.listPublished
);

// Librarian/Admin route
// Handle updating articles picture
router.post('/upload/articles-picture', 
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin, 
  dataHelper.upload, 
  ArticleController.handleArticlePictureUpload
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

// Admin: Bulk‐toggle published status
router.put(
  '/published/bulk',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  ArticleController.bulkSetPublished
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


module.exports = router;