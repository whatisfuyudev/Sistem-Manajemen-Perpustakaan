const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Reservation = require('../models/reservation.model');
const Book = require('../models/book.model');

// File to store timestamp of the last run
const LAST_RUN_FILE = path.join(__dirname, 'lastExpirationRun.txt');

/**
 * Updates all available reservations that have passed their expirationDate to "expired"
 * and increments the availableCopies for the associated book.
 * Returns the number of records updated.
 */
async function updateExpiredReservations() {
  const now = new Date();
  // Find reservations that are "available" but have expired
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

    // Increment availableCopies of the associated book
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

/**
 * Reads the timestamp of the last expiration check run from a file.
 */
async function getLastRunTime() {
  try {
    const timestamp = await fs.promises.readFile(LAST_RUN_FILE, 'utf8');
    return new Date(timestamp);
  } catch (error) {
    // File does not exist; return null
    return null;
  }
}

/**
 * Writes the current timestamp to record the last run time.
 */
async function setLastRunTime(date) {
  await fs.promises.writeFile(LAST_RUN_FILE, date.toISOString(), 'utf8');
}

/**
 * On startup, run the expiration check if it hasn't been performed today.
 */
async function runExpirationCheckIfNeeded() {
  const lastRun = await getLastRunTime();
  const now = new Date();
  // Compare dates (ignoring time) by converting to date string
  if (!lastRun || now.toDateString() !== lastRun.toDateString()) {
    const count = await updateExpiredReservations();
    console.log(`(Startup) ${count} reservation(s) expired.`);
    await setLastRunTime(now);
  } else {
    console.log('Expiration check already performed today on startup.');
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  try {
    const count = await updateExpiredReservations();
    console.log(`${count} reservation(s) updated to expired via cron.`);
    await setLastRunTime(new Date());
  } catch (error) {
    console.error('Error processing expired reservations:', error);
  }
});

console.log('Cron job scheduled: Expired reservations will be processed every day at midnight.');

// Run an immediate check on startup if needed
(async () => {
  try {
    await runExpirationCheckIfNeeded();
  } catch (error) {
    console.error('Error during startup expiration check:', error);
  }
})();
