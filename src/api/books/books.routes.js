// src/api/books/books.routes.js

const express = require('express');
const router = express.Router();
const booksController = require('./books.controller');
const dataHelper = require('../../utils/dataHelper');
const authMiddleware = require('../../middleware/auth.middleware');

// Route for searching/filtering books (must come before the parameterized route)
router.get('/search', booksController.searchBooks);

// Handle updating cover image [admin/librarian only]
router.post('/upload/cover', 
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  dataHelper.upload, 
  booksController.handleCoverImageUpload
);

// Create a new book [admin/librarian only]
router.post('/',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  booksController.createBook
);

// get 5 random books for homepage featured section
router.get('/random', booksController.listRandomBooks);

// Update a book by ISBN [admin/librarian only]
router.put('/update/:isbn',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  booksController.updateBook
);


router.delete(
  '/delete',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  booksController.bulkDeleteBooks
);

// Retrieve a single book by ISBN
router.get('/:isbn', booksController.getBook);

module.exports = router;