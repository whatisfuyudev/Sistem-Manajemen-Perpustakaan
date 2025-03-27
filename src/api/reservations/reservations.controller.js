// src/api/reservations/reservations.controller.js
const reservationsService = require('./reservations.service');

exports.createReservation = async (req, res, next) => {
  try {
    // Expecting { userId, bookIsbn, ... } in req.body
    const reservation = await reservationsService.createReservation(req.body, req.user);
    res.status(201).json(reservation);
  } catch (error) {
    next(error);
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const reservationId = req.params.id;
    const result = await reservationsService.cancelReservation(reservationId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.modifyReservation = async (req, res, next) => {
  try {
    const reservationId = req.params.id;
    const updatedReservation = await reservationsService.modifyReservation(reservationId, req.body);
    res.status(200).json(updatedReservation);
  } catch (error) {
    next(error);
  }
};

exports.promoteNextReservation = async (req, res, next) => {
  try {
    const bookIsbn = req.params.bookIsbn;
    const updatedReservation = await reservationsService.promoteNextReservation(bookIsbn);
    res.status(200).json(updatedReservation);
  } catch (error) {
    next(error);
  }
};

exports.getReservationHistory = async (req, res, next) => {
  try {
    const history = await reservationsService.getReservationHistory(req.query);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};
