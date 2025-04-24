// src/api/books/books.controller.js
const path = require('path');
const booksService = require('./books.service');

exports.createBook = async (req, res, next) => {
  try {
    // 1) Required fields validation
    const {
      isbn,
      title,
      authors,
      totalCopies
    } = req.body;

    const missing = [];
    if (!isbn)        missing.push('isbn');
    if (!title)       missing.push('title');
    if (!authors)     missing.push('authors');
    if (totalCopies == null) missing.push('totalCopies');

    if (missing.length) {
      return res
        .status(400)
        .json({ message: `Missing required field(s): ${missing.join(', ')}` });
    }

    // 2) Handle file upload (coverImage) if provided
    if (req.isImageUploadSuccesful && req.file) {
      // store the URL/path consistent with your static setup
      req.body.coverImage = `/public/images/book-covers/${req.file.filename}`;
    }

    // 3) Delegate to service for deeper normalization & creation
    const newBook = await booksService.createBook(req.body);
    res.status(201).json(newBook);

  } catch (err) {
    // Handle known errors with status, others bubble up as 500
    if (err instanceof CustomError) {
      return res.status(err.status).json({ message: err.message });
    }
    next(err);
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

exports.handleCoverImageUpload = async (req, res, next) => { 
  try {
    if(req.isImageUploadSuccesful) {
      
      res.json({ coverImage: `/public/images/book-covers/${req.file.filename}`});
    }
  } catch (error) {
    next(error);
  }
}

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
