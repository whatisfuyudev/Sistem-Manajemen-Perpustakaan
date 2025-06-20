const { DataTypes } = require('sequelize');
const sequelize = require("../utils/db");

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
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  genres: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  publisher: {
    type: DataTypes.STRING,
    allowNull: true
  },
  publicationYear: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'publication_year',
    validate: {
      min: 0
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  coverImage: {
    type: DataTypes.STRING,
    field: 'cover_image',
    allowNull: true
  },
  totalCopies: {
    type: DataTypes.INTEGER,
    field: 'total_copies',
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  availableCopies: {
    type: DataTypes.INTEGER,
    field: 'available_copies',
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  formats: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  pages: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'books',
  timestamps: true
});

module.exports = Book;
