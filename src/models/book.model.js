const { DataTypes } = require('sequelize');
const sequelize = require("../utils/db");

// Define the Book model
const Book = sequelize.define('Book', {
  isbn: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  authors: {
    // Using PostgreSQL ARRAY type to store multiple authors as strings
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  genres: {
    // Now stores multiple genre values as an array of strings
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  publisher: {
    type: DataTypes.STRING,
    allowNull: true
  },
  publicationYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coverImage: {
    // Could be a URL or path to the image
    type: DataTypes.STRING,
    allowNull: true
  },
  totalCopies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  availableCopies: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  formats: {
    // Store multiple formats (e.g., "eBook", "audiobook") as an array of strings
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  pages: {
    // New field: number of pages in the book
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'books',
  timestamps: true  // Automatically add createdAt and updatedAt fields
});

module.exports = Book;
