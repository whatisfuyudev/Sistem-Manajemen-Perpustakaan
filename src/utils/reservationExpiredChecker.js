const cron = require('node-cron');
const { Op } = require('sequelize');
const Reservation = require('../models/reservation.model');

/**
 * Retrieves all reservations that are pending but have expired.
 */
async function getExpiredReservations() {
  const now = new Date();
  const expiredReservations = await Reservation.findAll({
    where: {
      status: 'expired',
      expirationDate: { [Op.lt]: now }
    }
  });
  return expiredReservations;
}

/**
 * Updates all pending reservations with an expirationDate in the past to "expired".
 * Returns the number of records updated.
 */
async function updateExpiredReservations() {
  const now = new Date();
  const [affectedRows] = await Reservation.update(
    { status: 'expired' },
    {
      where: {
        status: 'available',
        expirationDate: { [Op.lt]: now }
      }
    }
  );
  return affectedRows;
}

// Schedule the job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    // Update expired reservations
    const updatedCount = await updateExpiredReservations();
    console.log(`${updatedCount} reservation(s) updated to expired.`);
    
    // Optionally, retrieve and log expired reservations (if any remain)
    const expiredRecords = await getExpiredReservations();
    console.log('Expired reservations:', expiredRecords);
    
    // Additional processing (e.g., notifications) can be added here.
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
});

console.log('Cron job scheduled: Expired reservations will be processed every day at midnight.');
