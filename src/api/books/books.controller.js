// src/api/books/books.controller.js

const booksService = require('./books.service');

exports.createBook = async (req, res, next) => {
  try {
    // Validate request body here if needed (e.g., check for required fields)
    const newBook = await booksService.createBook(req.body);
    res.status(201).json(newBook);
  } catch (error) {
    next(error);
  }
};

exports.listBooks = async (req, res, next) => {
  try {
    // You can pass query parameters for filtering/pagination
    const books = await booksService.getAllBooks(req.query);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
};

exports.getBook = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const book = await booksService.getBookByISBN(isbn);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
};

exports.updateBook = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const updatedBook = await booksService.updateBook(isbn, req.body);
    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found or update failed' });
    }
    res.status(200).json(updatedBook);
  } catch (error) {
    next(error);
  }
};

exports.deleteBook = async (req, res, next) => {
  try {
    const { isbn } = req.params;
    const deleted = await booksService.deleteBook(isbn);
    if (deleted) {
      return res.status(204).end();
    } else {
      return res.status(404).json({ message: 'Book not found or deletion not permitted' });
    }
  } catch (error) {
    next(error);
  }
};

exports.searchBooks = async (req, res, next) => {
  try {
    // Extract search term and any additional filter criteria from query parameters
    const filters = req.query;
    const results = await booksService.searchBooks(filters);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};
