// src/api/books/books.routes.js

const express = require('express');
const router = express.Router();
const booksController = require('./books.controller');
const dataHelper = require('../../utils/dataHelper');
const authMiddleware = require('../../middleware/auth.middleware');

// Route for searching/filtering books (must come before the parameterized route)
router.get('/search', booksController.searchBooks);

// Handle updating cover image
router.post('/upload/cover', dataHelper.upload, booksController.handleCoverImageUpload);

// Create a new book
router.post('/', dataHelper.upload, booksController.createBook);

// List all books (could also support query parameters for filtering)
router.get('/', booksController.listBooks);

// Retrieve a single book by ISBN
router.get('/:isbn', booksController.getBook);

// Update a book by ISBN
router.put('/update/:isbn', booksController.updateBook);

// Delete a book by ISBN
router.delete('/:isbn', booksController.deleteBook);

module.exports = router;
