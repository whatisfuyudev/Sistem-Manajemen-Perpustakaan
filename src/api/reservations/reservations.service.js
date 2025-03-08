// src/api/reservations/reservations.service.js
const { Op } = require('sequelize');
const Reservation = require('../../models/reservation.model');
const Book = require('../../models/book.model');  // For integration with checkouts/inventory (if needed)
const User = require('../../models/user.model')
const queueHelper = require('../../utils/queueHelper');
const emailHelper = require('../../utils/emailHelper');

const MAX_ACTIVE_RESERVATIONS = 5;
const RESERVATION_EXPIRATION_HOURS = 48; // Hours until an available reservation expires

exports.createReservation = async (data) => {
  const { userId, bookIsbn, notes } = data;
  if (!userId || !bookIsbn) {
    throw new Error('Missing required fields: userId and bookIsbn.');
  }

  // Verify that the book exists
  const book = await Book.findOne({ where: { isbn: bookIsbn } });
  if (!book) {
    throw new Error('Book not found.');
  }

  // Verify that the user exists
  const user = await User.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found.');
  }

  // Check if the user already has an active reservation for this book
  const existingReservation = await Reservation.findOne({
    where: { 
      userId, 
      bookIsbn,
      status: { [Op.in]: ['pending', 'available'] }
    }
  });
  if (existingReservation) {
    throw new Error('User already has an active reservation for this book.');
  }

  // Check if the user already has too many active reservations (pending or available)
  const activeReservationsCount = await Reservation.count({
    where: { 
      userId, 
      status: { [Op.in]: ['pending', 'available'] }
    }
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
    status: 'pending',
    notes 
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
  
  // Capture the current status before canceling
  const oldStatus = reservation.status;
  
  // Cancel the reservation
  reservation.status = 'canceled';
  await reservation.save();

  // Adjust queue positions for remaining pending reservations of this book
  await queueHelper.adjustQueuePositions(reservation.bookIsbn);

  // If the reservation was "available", add 1 to book availableCopies
  if (oldStatus === 'available') {
    const book = await Book.findOne({ where: { isbn: reservation.bookIsbn } });
    if (book) {
      await Book.update(
        { availableCopies: book.availableCopies + 1 },
        { where: { isbn: reservation.bookIsbn } }
      );
    }
  }

  return reservation;
};



// currently only able to modify the notes
exports.modifyReservation = async (reservationId, updateData) => {
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  if (!reservation) {
    throw new Error('Reservation not found.');
  }
  
  // Only allow modifications if the reservation is pending
  if (reservation.status !== 'pending') {
    throw new Error('Only pending reservations can be modified.');
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

  // Retrieve the book record and decrement availableCopies by one
  const book = await Book.findOne({ where: { isbn: bookIsbn } });
  if (book) {
    await Book.update(
      { availableCopies: book.availableCopies - 1 },
      { where: { isbn: bookIsbn } }
    );
  }
  
  // Optionally, send a notification to the user here.
  emailHelper.sendReservationAvailableEmail(reservation);

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
