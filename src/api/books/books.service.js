// src/api/books/books.service.js
const { Op, fn, col, where } = require('sequelize');
const Book = require('../../models/book.model'); // Adjust path as needed
const dataHelper = require('../../utils/dataHelper');
const CustomError = require('../../utils/customError');

/**
 * Create a new book.
 * - Checks for duplicate ISBN.
 * - If totalCopies is provided and availableCopies is missing, sets availableCopies = totalCopies.
 * - Split the authors, genres, and formats into an array from string with commas
 */
exports.createBook = async (bookData) => {
  // 1) Duplicate-ISBN guard
  const exists = await Book.findOne({ where: { isbn: bookData.isbn } });
  if (exists) {
    throw new CustomError('Book with this ISBN already exists.', 409);
  }

  // 2) Apply default for availableCopies if not explicitly given
  if (bookData.totalCopies != null && bookData.availableCopies == null) {
    bookData.availableCopies = bookData.totalCopies;
  }

  // 3) Ensure array fields are actual arrays
  const toArray = field =>
    Array.isArray(bookData[field])
      ? bookData[field]
      : typeof bookData[field] === 'string'
        ? bookData[field]
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : [];

  // authors is required, so we know toArray('authors') returns at least one element
  bookData.authors = toArray('authors');
  bookData.genres  = toArray('genres');
  bookData.formats = toArray('formats');

  // 4) Finally, create the Book record
  const newBook = await Book.create(bookData);
  return newBook;
};

/**
 * Retrieve all books with optional filtering.
 * Supports filtering by genre and author.
 */
exports.getAllBooks = async (query) => {
  const filters = {};
  
  if (query.genres) {
    filters.genres = query.genres;
  }
  
  if (query.author) {
    // Assumes 'authors' is stored as an array; use the PostgreSQL ARRAY operator "contains"
    filters.authors = { [Op.contains]: [query.author] };
  }
  
  const books = await Book.findAll({ where: filters });
  return books;
};

/**
 * Retrieve a single book by ISBN.
 */
exports.getBookByISBN = async (isbn) => {
  const book = await Book.findOne({ where: { isbn } });
  return book;
};

/**
 * Retrieve books whose title contains the given substring.
 * @param {string} titlePart — partial title to search for
 * @returns {Promise<Book[]>}
 */
exports.getBookByTitle = async (titlePart) => {
  if (!titlePart) {
    return [];
  }

  const books = await Book.findAll({
    where: {
      title: {
        // For Postgres, use iLike for case-insensitive:
        [Op.iLike]: `%${titlePart}%`
        // For other dialects, you can use Op.like:
        // [Op.like]: `%${titlePart}%`
      }
    }
  });

  return books;
};

/**
 * Update a book record by ISBN.
 * Adjusts availableCopies if totalCopies is modified.
 */
exports.updateBook = async (isbn, updateData) => {
  const book = await Book.findOne({ where: { isbn } });
  // If totalCopies is being updated, adjust availableCopies if necessary.
  if (updateData.totalCopies !== undefined) {
    if (!book) {
      return null;
    }
    // If availableCopies exceed the new totalCopies, set availableCopies to new totalCopies.
    if (book.availableCopies > updateData.totalCopies) {
      updateData.availableCopies = updateData.totalCopies;
    }
  }

  // check whether there is a new coverImage uploaded
  if (updateData.coverImage) {
    // if yes, delete old picture
    dataHelper.deleteFile(book.coverImage, (err) => {
      if (err) {
        console.error('Error deleting file:', err);
        return null;
      }
    });
  }
  
  const [affectedCount, affectedRows] = await Book.update(updateData, {
    where: { isbn },
    returning: true,
  });
  
  if (affectedCount === 0) {
    return null;
  }
  return affectedRows[0];
};

/**
 * Bulk-delete books by their ISBNs.
 * Also deletes any coverImage files on disk.
 * @param {string[]} isbns
 * @returns {Promise<number>} how many rows were deleted
 */
exports.bulkDelete = async (isbns) => {
  // 1) Fetch the matching books so we can delete any cover images
  const books = await Book.findAll({
    where: { isbn: { [Op.in]: isbns } },
    attributes: ['isbn','coverImage']
  });

  // 2) Delete each coverImage if present
  await Promise.all(books.map(b => {
    if (b.coverImage) {
      return new Promise(resolve => {
        dataHelper.deleteFile(b.coverImage, err => {
          if (err) console.error(`Error deleting cover for ISBN ${b.isbn}:`, err);
          resolve();
        });
      });
    }
    return Promise.resolve();
  }));

  // 3) Delete the database rows
  const deletedCount = await Book.destroy({
    where: { isbn: { [Op.in]: isbns } }
  });

  return deletedCount;
}

/**
 * Search and filter books.
 * Supports searching by title (case-insensitive), ISBN, filtering by genre, author,
 * and supports pagination.
 */
exports.searchBooks = async (filters) => {
  const { searchTerm, isbn, genres, author, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (searchTerm) {
    // Search in title using a case-insensitive partial match
    whereClause.title = { [Op.iLike]: `%${searchTerm}%` };
  }
  
  if (isbn) {
    // Search for ISBN using a case-insensitive partial match
    whereClause.isbn = { [Op.iLike]: `%${isbn}%` };
  }

  if (genres) {
    // Split the input by comma and trim each term
    const genreTerms = genres.split(',').map(term => term.trim().toLowerCase());
    // Build an array of conditions using Op.and so that each term must match
    whereClause[Op.and] = genreTerms.map(term => 
      where(
        fn('lower', fn('array_to_string', col('genres'), ',')),
        { [Op.iLike]: `%${term}%` }
      )
    );
  }

  if (author) {
    // Split the input by comma and trim each term
    const authorTerms = author.split(',').map(term => term.trim().toLowerCase());
    // Build an array of conditions using Op.and so that each term must match
    whereClause[Op.and] = authorTerms.map(term => 
      where(
        fn('lower', fn('array_to_string', col('authors'), ',')),
        { [Op.iLike]: `%${term}%` }
      )
    );
  }

  const { count, rows } = await Book.findAndCountAll({
    where: whereClause,
    offset,
    limit: parseInt(limit, 10)
  });

  return {
    total: count,
    books: rows,
    page: parseInt(page, 10)
  };
};

