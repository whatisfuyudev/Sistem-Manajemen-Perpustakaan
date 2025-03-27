// src/api/books/bookPage.controller.js
const booksService = require('./books.service');

exports.getBookDetailsPage = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = await booksService.getBookByISBN(isbn);
    if (!book) {
      return res.status(404).send('<h1>Book not found</h1>');
    }
    // Render the EJS template "book-details" with the book data
    res.render('book-details', { book });
  } catch (error) {
    next(error);
  }
};

exports.getSearchResultsPage = async (req, res, next) => {
  try {
    
    // Render the EJS template "book-details" with the book data
    res.render('search-result');
  } catch (error) {
    next(error);
  }
};