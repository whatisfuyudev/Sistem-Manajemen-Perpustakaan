// src/models/reservation.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Reservation = sequelize.define('Reservation', {
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
  requestDate: {
    type: DataTypes.DATE,
    field: 'request_date',
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  queuePosition: {
    type: DataTypes.INTEGER,
    field: 'queue_position',
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: {
        args: [0],
        msg: 'queue_position cannot be negative'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'available', 'fulfilled', 'canceled', 'expired'),
    allowNull: false,
    defaultValue: 'pending'
  },
  expirationDate: {
    type: DataTypes.DATE,
    field: 'expiration_date',
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING(75),
    allowNull: true
  }
}, {
  tableName: 'reservations',
  timestamps: true
});

module.exports = Reservation;
