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
    allowNull: false
  },
  bookIsbn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  requestDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  queuePosition: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('pending', 'available', 'fulfilled', 'canceled', 'expired'),
    allowNull: false,
    defaultValue: 'pending'
  },
  expirationDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'reservations',
  timestamps: true
});

module.exports = Reservation;
