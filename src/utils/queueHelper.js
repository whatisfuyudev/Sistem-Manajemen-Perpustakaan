// help manage the queue on all reservation
const Reservation = require('../models/reservation.model');


// Helper function to adjust queue positions after a cancellation or fulfillment
exports.adjustQueuePositions = async function (bookIsbn) {
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

