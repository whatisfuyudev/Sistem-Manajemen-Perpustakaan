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
  // Check if a book with the same ISBN already exists
  const existingBook = await Book.findOne({ where: { isbn: bookData.isbn } });
  if (existingBook) {
    throw new CustomError('Book with this ISBN already exists.', 409);
  }
  
  // If totalCopies is provided but availableCopies is not, initialize availableCopies to totalCopies.
  if (bookData.totalCopies && (bookData.availableCopies === undefined || bookData.availableCopies === null)) {
    bookData.availableCopies = bookData.totalCopies;
  }
  
  // Assume bookData is the payload received from the client
  // split them into an array
  if (typeof bookData.authors === 'string') {
    bookData.authors = bookData.authors.split(',').map(author => author.trim());
  }
  if (typeof bookData.genres === 'string') {
    bookData.genres = bookData.genres.split(',').map(genre => genre.trim());
  }
  if (typeof bookData.formats === 'string') {
    bookData.formats = bookData.formats.split(',').map(format => format.trim());
  }

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
 * Delete a book record by ISBN.
 */
exports.deleteBook = async (isbn) => {
  const book = await Book.findOne({ where: { isbn } });
  // if yes, delete old picture
  dataHelper.deleteFile(book.coverImage, (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return null;
    }
  });

  const deletedCount = await Book.destroy({ where: { isbn } });
  return deletedCount > 0;
};

/**
 * Search and filter books.
 * Supports searching by title (case-insensitive), filtering by genre, author,
 * and supports pagination.
 */
exports.searchBooks = async (filters) => {
  const { searchTerm, genres, author, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (searchTerm) {
    // Search in title using a case-insensitive partial match
    whereClause.title = { [Op.iLike]: `%${searchTerm}%` };
    // Optionally, add additional search criteria (e.g., ISBN or authors)
  }
  if (genres) {
    // Convert the genres array to a string and perform a case-insensitive search
    whereClause.genres = where(
      fn('lower', fn('array_to_string', col('genres'), ',')),
      { [Op.iLike]: `%${genres.toLowerCase()}%` }
    );
  }
  if (author) {
    // For case-insensitive search in an array field, convert the array to a string
    whereClause.authors = where(
      fn('lower', fn('array_to_string', col('authors'), ',')),
      { [Op.iLike]: `%${author.toLowerCase()}%` }
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
