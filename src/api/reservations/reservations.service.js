// src/api/reservations/reservations.service.js
const { Op } = require('sequelize');
const Reservation = require('../../models/reservation.model');
const Book = require('../../models/book.model');  // For integration with checkouts/inventory (if needed)

const MAX_ACTIVE_RESERVATIONS = 5;
const RESERVATION_EXPIRATION_HOURS = 48; // Hours until an available reservation expires

// Helper function to adjust queue positions after a cancellation or fulfillment
async function adjustQueuePositions(bookIsbn) {
  const reservations = await Reservation.findAll({
    where: { bookIsbn, status: 'pending' },
    order: [['queuePosition', 'ASC']]
  });
  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    if (reservation.queuePosition !== i + 1) {
      reservation.queuePosition = i + 1;
      await reservation.save();
    }
  }
}

exports.createReservation = async (data) => {
  const { userId, bookIsbn } = data;
  if (!userId || !bookIsbn) {
    throw new Error('Missing required fields: userId and bookIsbn.');
  }

  // Check if the user already has too many active reservations (pending or available)
  const activeReservationsCount = await Reservation.count({
    where: { userId, status: { [Op.in]: ['pending', 'available'] } }
  });
  if (activeReservationsCount >= MAX_ACTIVE_RESERVATIONS) {
    throw new Error('Reservation limit exceeded.');
  }

  // Determine the waitlist position by counting pending reservations for the same book
  const currentCount = await Reservation.count({
    where: { bookIsbn, status: 'pending' }
  });
  const queuePosition = currentCount + 1;

  // Create and return the new reservation record
  const reservation = await Reservation.create({
    userId,
    bookIsbn,
    queuePosition,
    requestDate: new Date(),
    status: 'pending'
  });

  return reservation;
};

exports.cancelReservation = async (reservationId) => {
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  if (!reservation) {
    throw new Error('Reservation not found.');
  }
  // Only pending or available reservations can be canceled
  if (!['pending', 'available'].includes(reservation.status)) {
    throw new Error('Reservation cannot be canceled.');
  }
  reservation.status = 'canceled';
  await reservation.save();

  // Adjust queue positions for remaining pending reservations of this book
  await adjustQueuePositions(reservation.bookIsbn);

  return reservation;
};

exports.modifyReservation = async (reservationId, updateData) => {
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  if (!reservation) {
    throw new Error('Reservation not found.');
  }
  // Allow modifications on specific fields (e.g., notes)
  if (updateData.notes !== undefined) {
    reservation.notes = updateData.notes;
  }
  // Additional fields may be allowed as needed.
  await reservation.save();
  return reservation;
};

exports.promoteNextReservation = async (bookIsbn) => {
  // Find the earliest pending reservation for the book
  const reservation = await Reservation.findOne({
    where: { bookIsbn, status: 'pending' },
    order: [['queuePosition', 'ASC']]
  });
  if (!reservation) {
    throw new Error('No pending reservations for this book.');
  }
  // Mark the reservation as available and set an expiration date (48 hours from now)
  reservation.status = 'available';
  reservation.expirationDate = new Date(Date.now() + RESERVATION_EXPIRATION_HOURS * 60 * 60 * 1000);
  await reservation.save();

  // In a real application, you might send a notification to the user here.
  return reservation;
};

exports.getReservationHistory = async (query) => {
  const where = {};
  if (query.userId) {
    where.userId = query.userId;
  }
  if (query.bookIsbn) {
    where.bookIsbn = query.bookIsbn;
  }
  if (query.status) {
    where.status = query.status;
  }
  const history = await Reservation.findAll({
    where,
    order: [['requestDate', 'DESC']]
  });
  return history;
};
