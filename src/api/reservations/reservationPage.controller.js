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

exports.renderAdminReservationAdd = async (req, res, next) => {
  try {
    // No pre‑fetched data needed; form fields are blank by default
    res.render('admin-reservation-add');
  } catch (err) {
    next(err);
  }
};

exports.renderReservationDetail = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result  = await reservationService.getReservationHistory({ id, limit: 1, page: 1 });
    const reservation = result.reservations[0];
    
    if (!reservation) {
      next();
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

exports.renderAdminReservationEdit = async (req, res, next) => {
  try {
    // 1) Parse the reservation ID
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).send('<h1>Invalid reservation ID</h1>');
    }

    // 2) Fetch the reservation record
    const reservation = await reservationService.getReservationById(id);
    if (!reservation) {
      next();
    }

    // 3) Render the EJS form, passing the reservation into the template
    res.render('admin-reservation-edit', { reservation });
  } catch (err) {
    next(err);
  }
};

exports.renderAdminReservationPromote = async (req, res, next) => {
  try {
    // No initial data needed; the page fetches via client‑side JS.
    res.render('admin-reservation-promote');
  } catch (err) {
    next(err);
  }
};
