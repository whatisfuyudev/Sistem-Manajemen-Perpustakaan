// src/models/notification.model.js
const { DataTypes } = require('sequelize');
const sequelize = require('../utils/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  channel: {
    type: DataTypes.ENUM('email', 'sms'),
    allowNull: false
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    defaultValue: 'pending'
  },
  read: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  scheduledAt: {
    type: DataTypes.DATE,
    field: 'scheduled_at',
    allowNull: true
  },
  deliveredAt: {
    type: DataTypes.DATE,
    field: 'delivered_at',
    allowNull: true
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;
