// src/api/books/books.service.js

const { Op } = require('sequelize');
const Book = require('../../models/book.model'); // Adjust path as needed

/**
 * Create a new book.
 * - Checks for duplicate ISBN.
 * - If totalCopies is provided and availableCopies is missing, sets availableCopies = totalCopies.
 */
exports.createBook = async (bookData) => {
  // Check if a book with the same ISBN already exists
  const existingBook = await Book.findOne({ where: { isbn: bookData.isbn } });
  if (existingBook) {
    throw new Error('Book with this ISBN already exists.');
  }
  
  // If totalCopies is provided but availableCopies is not, initialize availableCopies to totalCopies.
  if (bookData.totalCopies && (bookData.availableCopies === undefined || bookData.availableCopies === null)) {
    bookData.availableCopies = bookData.totalCopies;
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
  
  if (query.genre) {
    filters.genre = query.genre;
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
  // If totalCopies is being updated, adjust availableCopies if necessary.
  if (updateData.totalCopies !== undefined) {
    const book = await Book.findOne({ where: { isbn } });
    if (!book) {
      return null;
    }
    // If availableCopies exceed the new totalCopies, set availableCopies to new totalCopies.
    if (book.availableCopies > updateData.totalCopies) {
      updateData.availableCopies = updateData.totalCopies;
    }
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
  const deletedCount = await Book.destroy({ where: { isbn } });
  return deletedCount > 0;
};

/**
 * Search and filter books.
 * Supports searching by title (case-insensitive), filtering by genre, author,
 * and supports pagination.
 */
exports.searchBooks = async (filters) => {
  const { searchTerm, genre, author, page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (searchTerm) {
    // Search in title using a case-insensitive partial match
    whereClause.title = { [Op.iLike]: `%${searchTerm}%` };
    // Optionally, add additional search criteria (e.g., ISBN or authors)
  }
  if (genre) {
    whereClause.genre = genre;
  }
  if (author) {
    whereClause.authors = { [Op.contains]: [author] };
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
