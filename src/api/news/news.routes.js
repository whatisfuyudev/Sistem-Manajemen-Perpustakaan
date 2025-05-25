// routes/news.routes.js
const express = require('express');
const router = express.Router();
const NewsController = require('./news.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Public read routes
router.get('/news/published', NewsController.listPublished);
// new get individual news for public here

// Librarian/Admin write routes
router.get('/news',
  authMiddleware.verifyToken,
   NewsController.search
  );

router.post(
  '/news',
  authMiddleware.verifyToken,          // must be logged in
  authMiddleware.isLibrarianOrAdmin,   // and have Librarian or Admin role
  NewsController.create
);
router.put(
  '/news/:id',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  NewsController.update
);
router.put(
  '/news/:id/published',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  NewsController.setPublished
);

module.exports = router;
