// combinedScheduler.js
const cron = require('node-cron');
const fs   = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

const Checkout     = require('../models/checkout.model');
const Reservation  = require('../models/reservation.model');
const Book         = require('../models/book.model');
const Notification = require('../models/notification.model');
const emailHelper = require('./emailHelper');

// Single plain-text stamp file
const STAMP_FILE = path.join(__dirname, 'lastRun.txt');

/** Read the last‐run timestamp, or null if missing/invalid */
async function readLastRun() {
  try {
    const txt = await fs.readFile(STAMP_FILE, 'utf8');
    const iso = txt.trim();
    return iso ? new Date(iso) : null;
  } catch {
    return null;
  }
}

/** Write now() as the last‐run timestamp */
async function writeLastRun() {
  await fs.writeFile(STAMP_FILE, new Date().toISOString(), 'utf8');
}

/** Run all three tasks in sequence */
async function runAll() {
  console.log('› Overdue checkouts:', await processOverdues());
  console.log('› Expire reservations:', await processExpiredReservations());
  console.log('› Scheduled notifications:', await processScheduledNotifications());
}

/** Initialize: startup check + cron */
async function initScheduler() {
  const lastRun = await readLastRun();
  const today   = new Date().toDateString();

  if (!lastRun || lastRun.toDateString() !== today) {
    console.log('(Startup) running all tasks…');
    await runAll();
    await writeLastRun();
  } else {
    console.log('(Startup) already ran today, skipping.');
  }

  cron.schedule('0 0 * * *', async () => {
    console.log('(Cron) running all tasks…');
    await runAll();
    await writeLastRun();
  });

  console.log('→ Scheduled all tasks daily at midnight.');
}

/** Task definitions… */
async function processOverdues() {
  const [cnt] = await Checkout.update(
    { status: 'overdue' },
    { where: { status: 'active', dueDate: { [Op.lt]: new Date() } } }
  );
  return cnt;
}

async function processExpiredReservations() {
  const rows = await Reservation.findAll({
    where: { status: 'available', expirationDate: { [Op.lt]: new Date() } }
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

async function processScheduledNotifications() {
  const now   = new Date();
  const start = new Date(now).setHours(0,0,0,0);
  const end   = new Date(now).setHours(23,59,59,999);

  // 1) Fetch all pending email notifications for today
  const rows = await Notification.findAll({
    where: {
      status:      'pending',
      channel:     'email',
      scheduledAt: { [Op.lte]: now }
    }
  });

  if (!rows.length) return 0;

  let sentCount = 0;

  // 2) Loop and send each one
  for (const notification of rows) {
    try {
      // Delegate to utility which builds and sends the email
      await emailHelper.sendNotificationEmail(notification);

      // 3) Mark as sent only upon success
      notification.status      = 'sent';
      notification.deliveredAt = new Date();
      await notification.save();

      sentCount++;
    } catch (err) {
      console.error(
        `Error sending notification #${notification.id}:`,
        err
      );
      // mark failed:
      notification.status = 'failed';
      await notification.save();
    }
  }

  return sentCount;
}

// Kick off!
initScheduler().catch(err => console.error('Scheduler failed:', err));
