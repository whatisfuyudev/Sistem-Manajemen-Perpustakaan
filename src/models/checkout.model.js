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
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'reservations', // Name of the target table (the reservations table)
      key: 'id'            // Column in the target table that this field references
    }
    // Optionally, you can add onUpdate and onDelete constraints:
    // onUpdate: 'CASCADE',
    // onDelete: 'SET NULL'
  },
  renewalRequested: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requestedRenewalDays: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'checkouts',
  timestamps: true
});

module.exports = Checkout;
