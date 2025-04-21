// src/api/reservations/reservations.service.js
const { Op } = require('sequelize');
const Reservation = require('../../models/reservation.model');
const Book = require('../../models/book.model');  // For integration with checkouts/inventory (if needed)
const User = require('../../models/user.model')
const queueHelper = require('../../utils/queueHelper');
const emailHelper = require('../../utils/emailHelper');
const CustomError = require('../../utils/customError');

const MAX_ACTIVE_RESERVATIONS = 5;
const RESERVATION_EXPIRATION_HOURS = 48; // Hours until an available reservation expires

exports.createReservation = async (body, userData) => {
  const { bookIsbn, notes } = body;
  const userId = userData.id;

  if (!userId || !bookIsbn) {
    throw new CustomError('Missing required fields: userId and bookIsbn.', 400);
  }

  // Verify that the book exists
  const book = await Book.findOne({ where: { isbn: bookIsbn } });
  if (!book) {
    throw new CustomError('Book not found.', 404);
  }

  // Verify that the user exists
  const user = await User.findOne({ where: { id: userId } });
  if (!user) {
    throw new CustomError('User not found.', 404);
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
    throw new CustomError('User already has an active reservation for this book.', 409);
  }

  // Check if the user already has too many active reservations (pending or available)
  const activeReservationsCount = await Reservation.count({
    where: { 
      userId, 
      status: { [Op.in]: ['pending', 'available'] }
    }
  });
  if (activeReservationsCount >= MAX_ACTIVE_RESERVATIONS) {
    throw new CustomError('Reservation limit exceeded.', 400);
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

exports.updateReservation = async (reservationId, updates) => {
  // 1) Load the existing reservation record
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  if (!reservation) {
    throw new CustomError(
      `Reservation with id=${reservationId} not found`,
      404
    );
  }

  // 2) Validate userId (if provided in updates)
  if (updates.userId != null) {
    const user = await User.findByPk(updates.userId);
    if (!user) {
      throw new CustomError(
        `User with id=${updates.userId} not found`,
        404
      );
    }
  }

  // 3) Validate bookIsbn (if provided in updates)
  if (updates.bookIsbn != null) {
    const book = await Book.findByPk(updates.bookIsbn);
    if (!book) {
      throw new CustomError(
        `Book with ISBN=${updates.bookIsbn} not found`,
        404
      );
    }
  }

  // 4) Apply only the provided updates atomically
  reservation.set(updates);

  // 5) Persist changes and return the updated instance
  return await reservation.save();
};

exports.cancelReservation = async (reservationId) => {
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  if (!reservation) {
    throw new CustomError('Reservation not found.', 404);
  }
  // Only pending or available reservations can be canceled
  if (!['pending', 'available'].includes(reservation.status)) {
    throw new CustomError('Reservation cannot be canceled.', 400);
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

exports.getReservationById = async (reservationId) => {
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  return reservation;
};


// currently only able to modify the notes
exports.modifyReservation = async (reservationId, updateData) => {
  const reservation = await Reservation.findOne({ where: { id: reservationId } });
  if (!reservation) {
    throw new CustomError('Reservation not found.', 404);
  }
  
  // Only allow modifications if the reservation is pending
  if (reservation.status !== 'pending') {
    throw new CustomError('Only pending reservations can be modified.', 400);
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
    throw new CustomError('No pending reservations for this book.', 404);
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
  // Build dynamic WHERE clause
  const where = {};

  // 1) Direct ID lookup
  if (query.id) {
    where.id = parseInt(query.id, 10);         // exact match on primary key :contentReference[oaicite:1]{index=1}
  }

  // 2) User ID
  if (query.userId) {
    where.userId = parseInt(query.userId, 10); // exact match on foreign key :contentReference[oaicite:2]{index=2}
  }

  // 3) Book ISBN (partial match)
  if (query.bookIsbn) {
    where.bookIsbn = { [Op.iLike]: `%${query.bookIsbn}%` }; // case-insensitive contains :contentReference[oaicite:3]{index=3}
  }

  // 4) Status (single or grouped 'inactive')
  if (query.status) {
    if (query.status === 'inactive') {
      where.status = { [Op.in]: ['fulfilled', 'canceled', 'expired'] }; // IN operator :contentReference[oaicite:4]{index=4}
    } else {
      where.status = query.status;
    }
  }

  // 5) Queue position range
  if (query.queueMin || query.queueMax) {
    where.queuePosition = {};
    if (query.queueMin) {
      where.queuePosition[Op.gte] = parseInt(query.queueMin, 10); // >= minimum :contentReference[oaicite:5]{index=5}
    }
    if (query.queueMax) {
      where.queuePosition[Op.lte] = parseInt(query.queueMax, 10); // <= maximum :contentReference[oaicite:6]{index=6}
    }
  }

  // 6) Request date range
  if (query.reqDateFrom || query.reqDateTo) {
    where.requestDate = {};
    if (query.reqDateFrom) {
      where.requestDate[Op.gte] = new Date(query.reqDateFrom);    // >= start date :contentReference[oaicite:7]{index=7}
    }
    if (query.reqDateTo) {
      where.requestDate[Op.lte] = new Date(query.reqDateTo);     // <= end date 
    }
  }

  // 7) Expiration date range
  if (query.expDateFrom || query.expDateTo) {
    where.expirationDate = {};
    if (query.expDateFrom) {
      where.expirationDate[Op.gte] = new Date(query.expDateFrom);
    }
    if (query.expDateTo) {
      where.expirationDate[Op.lte] = new Date(query.expDateTo);
    }
  }

  // 8) Notes full-text search
  if (query.notes) {
    where.notes = { [Op.iLike]: `%${query.notes}%` };              // text contains :contentReference[oaicite:8]{index=8}
  }

  // Pagination defaults
  const page   = query.page ? parseInt(query.page, 10) : 1;
  const limit  = query.limit ? parseInt(query.limit, 10) : 10;
  const offset = (page - 1) * limit;

  // Execute query with count & paginated rows
  const { count, rows } = await Reservation.findAndCountAll({
    where,
    order: [['requestDate', 'DESC']],
    offset,
    limit
  });

  return {
    total:         count,
    reservations:  rows,
    page
  };
};
