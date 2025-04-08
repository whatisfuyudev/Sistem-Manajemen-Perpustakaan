// src/api/books/bookPage.routes.js
const express = require('express');
const router = express.Router();
const bookPageController = require('./bookPage.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// New endpoint for rendering book details page (admin/librarian only)
router.get(
  '/admin/details/:isbn',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  bookPageController.getAdminBookDetailsPage
);

// New endpoint for rendering the book editing page; restricted to admin/librarian
router.get(
  '/admin/edit/:isbn',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  bookPageController.getAdminEditBookPage
);

// Route for getting search result page (must come before the parameterized route)
router.get('/search', bookPageController.getSearchResultsPage);

// New endpoint for rendering book details page
router.get('/details/:isbn', bookPageController.getBookDetailsPage);

module.exports = router;
