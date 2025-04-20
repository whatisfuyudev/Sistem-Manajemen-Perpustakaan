// src/api/reservations/reservationPage.controller.js
const reservationService = require('./reservations.service');
const Book    = require('../../models/book.model');
const User    = require('../../models/user.model');

exports.renderMyReservationsPage = async (req, res, next) => {
  try {
    // req.user should have the minimal user information (id, role)
    if (!req.user || !req.user.id) {
      // Redirect to login if no valid token exists
      return res.redirect('/auth/login');
    }
    
    // send the my reservation page
    res.render('my-reservations');
  } catch (error) {
    next(error);
  }
};

exports.renderReservationDetail = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result  = await reservationService.getReservationHistory({ id, limit: 1, page: 1 });
    const reservation = result.reservations[0];
    
    if (!reservation) {
      return res.status(404).send('<h1>Reservation not found</h1>');
    }

    // Load related Book and User
    const book = await Book.findByPk(reservation.bookIsbn);
    const user = await User.findByPk(reservation.userId);

    // Render the EJS page
    res.render('admin-reservation-detail', { reservation, book, user });
  } catch (err) {
    next(err);
  }
};
