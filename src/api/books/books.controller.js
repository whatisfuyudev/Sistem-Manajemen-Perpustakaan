// src/api/books/books.controller.js
const booksService = require('./books.service');

exports.createBook = async (req, res, next) => {
  try {
    // Normalize types 
    const data = req.body;

    // Remove any empty fields
    Object.keys(data).forEach(key => {
      const val = data[key];
      const isEmptyString = typeof val === 'string' && val.trim() === '';
      const isEmptyArray  = Array.isArray(val) && val.length === 0;
      const isNullish     = val == null; // catches null or undefined
      if (isNullish || isEmptyString || isEmptyArray) {
        delete data[key];
      }
    });

    // Parse numeric fields
    ['totalCopies','publicationYear','pages'].forEach(field => {
      if (data[field] != null) {
        data[field] = Number.parseInt(data[field], 10);
      }
    });

    // Required fields validation
    const { isbn, title, authors, totalCopies } = data;
    const missing = [];
    if (!isbn)             missing.push('isbn');
    if (!title)            missing.push('title');
    if (!authors?.length)  missing.push('authors');
    if (totalCopies == null) missing.push('totalCopies');
    if (missing.length) {
      return res
        .status(400)
        .json({ message: `Missing required field(s): ${missing.join(', ')}` });
    }

    // Delegate to service (which will trust your types now)
    const newBook = await booksService.createBook(data);
    res.status(201).json(newBook);

  } catch (err) {
    next(err);
  }
};

exports.listRandomBooks = async (req, res, next) => {
  try {
    // default to 5 if no explicit ?limit=
    const limit = parseInt(req.query.limit, 10) || 5;

    const books = await booksService.getRandomBooks({ limit });
    res.status(200).json(books);
  } catch (err) {
    next(err);
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

    // Remove any empty fields
    const data = req.body;
    Object.keys(data).forEach(key => {
      const val = data[key];
      const isEmptyString = typeof val === 'string' && val.trim() === '';
      const isEmptyArray  = Array.isArray(val) && val.length === 0;
      const isNullish     = val == null; // catches null or undefined
      if (isNullish || isEmptyString || isEmptyArray) {
        delete data[key];
      }
    });
    
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

/**
 * Bulk-delete books.
 * Expects JSON body: { isbns: ['123', '456', ...] }
 */
exports.bulkDeleteBooks = async (req, res, next) => {
  try {
    const { isbns } = req.body;
    if (!Array.isArray(isbns) || isbns.length === 0) {
      return res.status(400).json({ message: 'No ISBNs provided for deletion' });
    }

    const deletedCount = await booksService.bulkDelete(isbns);

    res.status(200).json({
      message: `Deleted ${deletedCount} book${deletedCount !== 1 ? 's' : ''}.`
    });
  } catch (err) {
    next(err);
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
