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
    field: 'user_id',
    allowNull: false
  },
  bookIsbn: {
    type: DataTypes.STRING,
    field: 'book_isbn',
    allowNull: false
  },
  checkoutDate: {
    type: DataTypes.DATE,
    field: 'checkout_date',
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  dueDate: {
    type: DataTypes.DATE,
    field: 'due_date',
    allowNull: false
  },
  returnDate: {
    type: DataTypes.DATE,
    field: 'return_date',
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'returned', 'overdue', 'lost', 'damaged'),
    allowNull: false,
    defaultValue: 'active'
  },
  renewalCount: {
    type: DataTypes.INTEGER,
    field: 'renewal_count',
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  // can be used as a history
  fine: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  // how much actual fine yet to be payed
  // this is a relic of the past for the repair book
  // and replace book, consider deleting it
  outstandingFine: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'outstanding_fine',
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  reservationId: {
    type: DataTypes.INTEGER,
    field: 'reservation_id',
    allowNull: true,
  },
  renewalRequested: {
    type: DataTypes.BOOLEAN,
    field: 'renewal_requested',
    allowNull: false,
    defaultValue: false
  },
  requestedRenewalDays: {
    type: DataTypes.INTEGER,
    field: 'requested_renewal_days',
    allowNull: true,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'checkouts',
  timestamps: true,
  // Optional: also add model-wide validation or hooks if you wish to enforce extra logic
  // For example, prevent returnDate before checkoutDate, etc.
});

module.exports = Checkout;
