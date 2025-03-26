// src/api/books/bookPage.routes.js
const express = require('express');
const router = express.Router();
const bookPageController = require('./bookPage.controller');

// New endpoint for rendering book details page
router.get('/details/:isbn', bookPageController.getBookDetailsPage);

module.exports = router;
