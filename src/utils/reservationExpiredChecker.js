const cron = require('node-cron');
const { Op } = require('sequelize');
const Reservation = require('../models/reservation.model');
const Book = require('../models/book.model');

/**
 * Updates all available reservations that have passed their expirationDate to "expired"
 * and increments the availableCopies for the associated book.
 * Returns the number of records updated.
 */
async function updateExpiredReservations() {
  const now = new Date();
  // Find reservations that are still "available" but have expired
  const expiredReservations = await Reservation.findAll({
    where: {
      status: 'available',
      expirationDate: { [Op.lt]: now }
    }
  });

  let count = 0;
  for (const reservation of expiredReservations) {
    // Mark reservation as expired
    await reservation.update({ status: 'expired' });
    count++;

    // Increment the availableCopies of the associated book
    // Assumes the Reservation model contains a bookIsbn field
    if (reservation.bookIsbn) {
      const book = await Book.findOne({ where: { isbn: reservation.bookIsbn } });
      if (book) {
        await Book.update(
          { availableCopies: book.availableCopies + 1 },
          { where: { isbn: reservation.bookIsbn } }
        );
      }
    }
  }
  return count;
}

// Schedule the job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    const updatedCount = await updateExpiredReservations();
    console.log(`${updatedCount} reservation(s) updated to expired and their associated book copies incremented.`);
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
});

console.log('Cron job scheduled: Expired reservations will be processed every day at midnight.');


(async () => await updateExpiredReservations())();