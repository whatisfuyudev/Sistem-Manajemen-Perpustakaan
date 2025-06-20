const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const News = sequelize.define('news', {
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
  imageUrl: {
    type: DataTypes.TEXT,
    field: 'image_url',
    allowNull: true
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  // Automatically adds `createdAt` (when the row was inserted)
  // and `updatedAt` timestamps
  timestamps: true
});

module.exports = News;
