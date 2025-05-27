// routes/news.routes.js
const express = require('express');
const router = express.Router();
const NewsController = require('./news.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const dataHelper = require('../../utils/dataHelper');

// Public read route
router.get('/published', NewsController.getAllPublished);

// public Route
// Handle updating news picture
router.post('/upload/news-picture', 
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin, 
  dataHelper.upload, 
  NewsController.handleNewsPictureUpload
);

// Librarian/Admin route
router.get('/search',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  NewsController.searchNews
);

// Librarian/Admin route
router.post(
  '/create',
  authMiddleware.verifyToken,          // must be logged in
  authMiddleware.isLibrarianOrAdmin,   // and have Librarian or Admin role
  NewsController.createNews
);

// NEW: Bulk‐delete News
router.delete(
  '/delete',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  NewsController.bulkDeleteNews
);

// get individual news for public here
router.get('/:id', NewsController.getByIdPublic);

// Librarian/Admin route
router.put(
  '/edit/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  NewsController.updateNews
);

// Librarian/Admin route
router.put(
  '/:id/published',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  NewsController.markPublished
);

module.exports = router;
