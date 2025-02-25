// check a checkout if it is overdue 

const cron = require('node-cron');
const { Op } = require('sequelize');
const Checkout = require('../models/checkout.model');

/**
 * Retrieves all overdue checkouts.
 * An overdue checkout is one where:
 *  - The checkout status is 'active'
 *  - The due date is less than the current date/time.
 */
async function getOverdueCheckouts() {
  const now = new Date();
  const overdueCheckouts = await Checkout.findAll({
    where: {
      status: 'active',
      dueDate: { [Op.lt]: now }
    }
  });
  return overdueCheckouts;
}

/**
 * Updates the status of overdue checkouts.
 * For each active checkout with a due date in the past,
 * the status is updated to 'overdue'.
 *
 * Returns the number of records updated.
 */
async function updateOverdueCheckouts() {
  const now = new Date();
  const [affectedRows] = await Checkout.update(
    { status: 'overdue' },
    {
      where: {
        status: 'active',
        dueDate: { [Op.lt]: now }
      }
    }
  );
  return affectedRows;
}

cron.schedule('0 0 * * *', async () => {
  try {
    // Update overdue checkouts
    const updatedCount = await updateOverdueCheckouts();
    console.log(`${updatedCount} checkout(s) updated to overdue.`);
    
    // Optionally, retrieve the overdue records
    const overdueRecords = await getOverdueCheckouts();
    console.log('Overdue checkouts:', overdueRecords);
    
    // Here you can add further processing such as notifications or fine calculation.
  } catch (error) {
    console.error('Error processing overdue checkouts:', error);
  }
});

console.log('Cron job scheduled: Overdue checkouts will be processed every day at midnight.');