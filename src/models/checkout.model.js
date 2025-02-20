// src/models/checkout.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Checkout = sequelize.define('Checkout', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bookIsbn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  checkoutDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  returnDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'returned', 'overdue', 'lost', 'damaged'),
    allowNull: false,
    defaultValue: 'active'
  },
  renewalCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  fine: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  }
}, {
  tableName: 'checkouts',
  timestamps: true
});

module.exports = Checkout;
