// src/api/books/bookPage.routes.js
const express = require('express');
const router = express.Router();
const bookPageController = require('./bookPage.controller');

// Route for getting search result page (must come before the parameterized route)
router.get('/search', bookPageController.getSearchResultsPage);

// New endpoint for rendering book details page
router.get('/details/:isbn', bookPageController.getBookDetailsPage);

module.exports = router;
