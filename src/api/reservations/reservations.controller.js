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

exports.updateAdminReservation = async (req, res, next) => {
  // 1) Parse the reservation ID from the URL
  const id = parseInt(req.params.id, 10);    // req.params usage :contentReference[oaicite:5]{index=5}

  // 2) Build an updates object from the request body
  const updates = {
    userId:         req.body.userId,
    bookIsbn:       req.body.bookIsbn,
    requestDate:    req.body.requestDate,
    status:         req.body.status,
    expirationDate: req.body.expirationDate || null,
    notes:          req.body.notes || null
  };

  try {
    // 3) Delegate to service layer
    const updated = await reservationsService.updateReservation(id, updates);

    // 4) Send back success JSON
    res.status(200).json({
      message:     'Reservation updated successfully',
      reservation: updated
    });                                         // JSON response pattern :contentReference[oaicite:6]{index=6}
  } catch (err) {
    next(err);                                  // pass errors to your error handler
  }
};

exports.cancelReservation = async (req, res, next) => {
  try {
    const reservationId = req.params.id;
    
    // Check if the authenticated user is a Patron
    if (req.user.role === 'Patron') {
      // Retrieve the reservation first
      const reservation = await reservationsService.getReservationById(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found.' });
      }
      // If the reservation does not belong to the authenticated user, return error
      if (reservation.userId !== req.user.id) {
        return res.status(403).json({ message: 'You can only cancel your own reservation.' });
      }
    }
    
    const result = await reservationsService.cancelReservation(reservationId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};


exports.modifyReservation = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const reservationId = req.params.id;

    const reservation = await reservationsService.getReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    // Only the owner or an admin can modify
    if (req.user.role === 'Patron' && reservation.userId !== req.user.id) {
      return res.status(403).json({ message: 'You can only modify your own reservation.' });
    }

    reservation.notes = notes;
    await reservation.save();

    res.status(200).json({ message: 'Reservation updated successfully.' });
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

exports.getMyReservations = async (req, res, next) => {
  try {
    // Get user id from the verified token (attached by authMiddleware.verifyToken)
    const userId = req.user.id;
    const history = await reservationsService.getReservationHistory({ ...req.query, userId });
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};
