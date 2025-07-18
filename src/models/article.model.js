// models/article.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(75),
    allowNull: false,
    validate: {
      len: {
        args: [1, 75],
        msg: 'Title must be between 1 and 75 characters'
      }
    }
  },
  coverImage: {
    type: DataTypes.STRING,
    field: 'cover_image',
    allowNull: true,
  },
  body: {
    type: DataTypes.JSONB,    // for quilljs
    allowNull: false
  },
  authorName: {
    type: DataTypes.STRING(125),
    allowNull: false,
    field: 'author_name',
    validate: {
      len: {
        args: [1, 125],
        msg: 'Author name must be between 1 and 125 characters'
      }
    }
  },
  readingTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reading_time',
    comment: 'Estimated reading time in minutes',
    validate: {
      min: {
        args: [1],
        msg: 'Reading time must be at least 1 minute'
      }
    }
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  timestamps: true, // adds createdAt and updatedAt
  tableName: 'articles'
});

module.exports = Article;
