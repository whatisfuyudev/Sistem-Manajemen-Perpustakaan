// src/api/books/bookPage.controller.js
const booksService = require('./books.service');

exports.getAdminBookDetailsPage = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = await booksService.getBookByISBN(isbn);
    if (!book) {
      next();
    }
    // Render the EJS template "admin-book-detail" with the book data.
    // (You can use the same template as the public version if preferred.)
    res.render('admin-book-detail', { book });
  } catch (error) {
    next(error);
  }
};

exports.getAdminEditBookPage = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = await booksService.getBookByISBN(isbn);
    if (!book) {
      next();
    }
    // Render the EJS template "admin-book-edit" with the book data
    res.render('admin-book-edit', { book });
  } catch (error) {
    next(error);
  }
};

exports.getAdminAddBookPage = async (req, res, next) => {
  try {
    // Render the EJS template "admin-book-add" 
    res.render('admin-book-add');
  } catch (error) {
    next(error);
  }
};

exports.getBookDetailsPage = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = await booksService.getBookByISBN(isbn);
    if (!book) {
      next();
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