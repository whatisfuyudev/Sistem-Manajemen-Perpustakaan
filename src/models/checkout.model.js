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
  outstandingFine: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0
    }
  },
  reservationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'reservations', // Name of the target table
      key: 'id'
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
