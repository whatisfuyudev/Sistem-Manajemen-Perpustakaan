// combinedScheduler.js
const cron = require('node-cron');
const fs   = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

const Checkout     = require('../models/checkout.model');
const Reservation  = require('../models/reservation.model');
const Book         = require('../models/book.model');
const Notification = require('../models/notification.model');

// Single stamp file
const STAMP_FILE = path.join(__dirname, 'lastRuns.json');

// Read the entire stamp-object (or return empty)
async function readStamps() {
  try {
    const txt = await fs.readFile(STAMP_FILE, 'utf8');
    return JSON.parse(txt);
  } catch {
    return {}; // never run
  }
}

// Write updated stamp-object
async function writeStamps(obj) {
  await fs.writeFile(STAMP_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

// Generic runner: on startup if needed + cron
function scheduleDaily(key, processor, label) {
  // startup
  (async () => {
    const stamps = await readStamps();
    const lastRun = stamps[key] ? new Date(stamps[key]) : null;
    const today   = new Date().toDateString();

    if (!lastRun || lastRun.toDateString() !== today) {
      const count = await processor();
      console.log(`(Startup) ${label}: processed ${count}.`);
      stamps[key] = new Date().toISOString();
      await writeStamps(stamps);
    } else {
      console.log(`(Startup) ${label}: already run today.`);
    }
  })().catch(console.error);

  // cron at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      const count = await processor();
      console.log(`(Cron) ${label}: processed ${count}.`);
      const stamps = await readStamps();
      stamps[key] = new Date().toISOString();
      await writeStamps(stamps);
    } catch (err) {
      console.error(`Error in ${label}:`, err);
    }
  });

  console.log(`→ Scheduled ${label} daily at 00:00.`);
}

/** Task 1: Overdue Checkouts */
async function processOverdues() {
  const now = new Date();
  const [cnt] = await Checkout.update(
    { status: 'overdue' },
    { where: { status: 'active', dueDate: { [Op.lt]: now } } }
  );
  return cnt;
}

/** Task 2: Expired Reservations */
async function processExpiredReservations() {
  const now = new Date();
  const rows = await Reservation.findAll({
    where: { status: 'available', expirationDate: { [Op.lt]: now } }
  });

  let cnt = 0;
  for (const r of rows) {
    await r.update({ status: 'expired' });
    if (r.bookIsbn) {
      const book = await Book.findByPk(r.bookIsbn);
      if (book) await book.increment('availableCopies');
    }
    cnt++;
  }
  return cnt;
}

/** Task 3: Scheduled Notifications */
async function processScheduledNotifications() {
  const now = new Date();
  const start = new Date(now).setHours(0,0,0,0);
  const end   = new Date(now).setHours(23,59,59,999);

  const rows = await Notification.findAll({
    where: {
      status: 'pending',
      scheduledAt: { [Op.between]: [start, end] }
    }
  });
  if (!rows.length) return 0;


  // should be sending mail instead with util file
  const ids = rows.map(n => n.id);
  const [cnt] = await Notification.update(
    { status: 'sent', deliveredAt: new Date() },
    { where: { id: { [Op.in]: ids } } }
  );
  return cnt;
}

// Wire them up
scheduleDaily('overdue',    processOverdues,            'Overdue Checkouts');
scheduleDaily('expireResv', processExpiredReservations, 'Expired Reservations');
scheduleDaily('notify',     processScheduledNotifications, 'Scheduled Notifications');
