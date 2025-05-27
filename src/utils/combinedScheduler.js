// combinedScheduler.js
const cron = require('node-cron');
const fs   = require('fs').promises;
const path = require('path');
const { Op } = require('sequelize');

const Checkout     = require('../models/checkout.model');
const Reservation  = require('../models/reservation.model');
const Book         = require('../models/book.model');
const Notification = require('../models/notification.model');
const News         = require('../models/news.model');
const emailHelper = require('./emailHelper');

// Folders to clean + which model + which attribute holds the URL
const CLEANUP_TARGETS = [
  {
    dir:     path.join(__dirname, '../public/images/news-pictures'),
    model:   News,
    attr:    'imageUrl',
    protect: new Set(['default.png'])
  },
  {
    dir:     path.join(__dirname, '../public/images/book-covers'),
    model:   Book,
    attr:    'coverImage',    // adjust to your actual field name
    protect: new Set(['default-cover.jpg'])
  },
  {
    dir:     path.join(__dirname, '../public/images/profile-pictures'),
    model:   User,
    attr:    'profilePicture', // adjust to your actual field name
    protect: new Set(['default.jpg'])
  }
];

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

/** Run all tasks in sequence */
async function runAll() {
  console.log('› Overdue checkouts:', await processOverdues());
  console.log('› Expire reservations:', await processExpiredReservations());
  console.log('› Scheduled notifications:', await processScheduledNotifications());
  // Loop through each cleanup target
  for (const t of CLEANUP_TARGETS) {
    const count = await cleanupOrphanImages(t);
    console.log(`› Cleaned orphans in ${path.basename(t.dir)}:`, count);
  }
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

/** Helper: extract filename from stored URL */
function filenameFromUrl(url) {
  try {
    //                     change it to domain name when hosting it in production
    return path.basename(new URL(url, 'http://example.com').pathname);
  } catch {
    return null;
  }
}

/**
 * Cleanup orphans in one directory/model/attr combo.
 * @param {Object} target
 * @param {string} target.dir     – directory path
 * @param {Model}  target.model   – Sequelize model
 * @param {string} target.attr    – attribute holding URL
 * @param {Set}    target.protect – filenames to skip
 */
async function cleanupOrphanImages({ dir, model, attr, protect }) {
  let deletedCount = 0;
  try {
    const files = await fs.readdir(dir);
    // fetch all non-null attr values
    const rows = await model.findAll({
      attributes: [attr],
      where: { [attr]: { [Op.ne]: null } }
    });
    const used = new Set(
      rows
        .map(r => filenameFromUrl(r[attr]))
        .filter(Boolean)
    );

    const now = Date.now();
    for (const file of files) {
      if (file.startsWith('.') || protect.has(file)) continue;
      if (!used.has(file)) {
        const fullPath = path.join(dir, file);
        const stat     = await fs.stat(fullPath);
        const ageMs    = now - stat.mtimeMs;

        // only delete if older than 24h
        if (ageMs > (24 * 3600 * 1000)) {
          await fs.unlink(fullPath);
          deletedCount++;
        }
      }
    }
  } catch (err) {
    console.error(`Error cleaning ${dir}:`, err);
  }
  return deletedCount;
}

// Kick off!
initScheduler().catch(err => console.error('Scheduler failed:', err));
