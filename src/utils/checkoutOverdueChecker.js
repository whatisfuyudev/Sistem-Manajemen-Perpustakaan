// overdueCheckScheduler.js
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const Checkout = require('../models/checkout.model');

const LAST_RUN_FILE = path.join(__dirname, 'lastOverdueRun.txt');

/**
 * Update overdue checkouts:
 * - Any checkout with status 'active' and a dueDate in the past is marked 'overdue'.
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

/**
 * Retrieve overdue checkouts (for logging purposes)
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
 * Read the timestamp of the last overdue check from a file.
 */
async function getLastRunTime() {
  try {
    const timestamp = await fs.promises.readFile(LAST_RUN_FILE, 'utf8');
    return new Date(timestamp);
  } catch (err) {
    // If file doesn't exist, return null
    return null;
  }
}

/**
 * Save the current timestamp as the last run time.
 */
async function setLastRunTime(date) {
  await fs.promises.writeFile(LAST_RUN_FILE, date.toISOString(), 'utf8');
}

/**
 * On startup, run an overdue check if it hasn't been run yet today.
 */
async function runOverdueCheckIfNeeded() {
  const lastRun = await getLastRunTime();
  const now = new Date();
  const todayDate = now.toDateString();
  const lastRunDate = lastRun ? lastRun.toDateString() : null;
  
  if (lastRunDate !== todayDate) {
    const updatedCount = await updateOverdueCheckouts();
    console.log(`(Startup) ${updatedCount} checkout(s) updated to overdue.`);
    await setLastRunTime(now);
  } else {
    console.log('Overdue check already performed today on startup.');
  }
}

// Immediately run the startup check and schedule the daily cron job.
(async () => {
  try {
    // Run overdue check on startup if needed
    await runOverdueCheckIfNeeded();
    
    // Schedule the cron job to run every day at midnight (server time)
    cron.schedule('0 0 * * *', async () => {
      try {
        const updatedCount = await updateOverdueCheckouts();
        console.log(`${updatedCount} checkout(s) updated to overdue.`);
        
        const overdueRecords = await getOverdueCheckouts();
        console.log('Overdue checkouts:', overdueRecords);
        
        await setLastRunTime(new Date());
      } catch (error) {
        console.error('Error processing overdue checkouts:', error);
      }
    });
    
    console.log('Cron job scheduled: Overdue checkouts will be processed every day at midnight.');
  } catch (error) {
    console.error('Error during overdue check initialization:', error);
  }
})();
