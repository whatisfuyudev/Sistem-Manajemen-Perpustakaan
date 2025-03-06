// reports.service.js
const { Op, fn, col, literal } = require('sequelize');
const Checkout = require('../../models/checkout.model');
const Reservation = require('../../models/reservation.model');
const Book = require('../../models/book.model');
const User = require('../../models/user.model');
// Assume you have some utility functions in dateHelper if needed
const { groupByPeriod } = require('../../utils/dateHelper');

/**
 * Circulation Report: Aggregates checkouts, renewals, returns, and overdue transactions.
 * Accepts a period filter: 'daily', 'weekly', 'monthly'
 */
exports.getCirculationReport = async ({ period }) => {
  // Fetch all checkouts with only the fields needed for grouping
  const checkouts = await Checkout.findAll({
    attributes: ['id', 'checkoutDate']
  });
  
  // Use the groupByPeriod utility to group checkouts by the desired period (daily, weekly, monthly)
  const grouped = groupByPeriod(checkouts, period);
  
  // Transform the grouped data into an aggregated format: count checkouts per group
  const aggregated = Object.keys(grouped).map(key => ({
    date: key,
    totalCheckouts: grouped[key].length
  }));
  
  // Sort the aggregated results in descending order by date
  aggregated.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return { period, checkouts: aggregated };
};

/**
 * Reservation Report: Lists reservations segmented by status.
 */
exports.getReservationReport = async (query) => {
  const where = {};
  if (query.userId) where.userId = query.userId;
  if (query.bookIsbn) where.bookIsbn = query.bookIsbn;
  // Group by status
  const reservations = await Reservation.findAll({ where, order: [['requestDate', 'DESC']] });
  
  // Optionally, you can count or group by status
  const grouped = reservations.reduce((acc, res) => {
    acc[res.status] = (acc[res.status] || 0) + 1;
    return acc;
  }, {});
  
  return { reservations, groupedByStatus: grouped };
};

/**
 * Overdue Report: Identifies overdue checkouts and aggregates overdue metrics.
 */
exports.getOverdueReport = async (query) => {
  const now = new Date();
  const overdueCheckouts = await Checkout.findAll({
    where: {
      status: { [Op.in]: ['active', 'overdue'] },
      dueDate: { [Op.lt]: now }
    },
    order: [['dueDate', 'ASC']]
  });
  
  // Calculate total overdue fine amounts (as a simple example)
  const totalFine = overdueCheckouts.reduce((sum, checkout) => {
    return sum + parseFloat(checkout.fine || 0);
  }, 0);
  
  return { overdueCheckouts, totalFine };
};

/**
 * Inventory Report: Provides insights into book availability and condition.
 */
exports.getInventoryReport = async (query) => {
  // For this example, we assume Book model has availableCopies and a status field (if applicable)
  const books = await Book.findAll({
    attributes: ['isbn', 'title', 'availableCopies', 'totalCopies'],
    order: [['title', 'ASC']]
  });
  return books;
};

/**
 * User Engagement Report: Aggregates user activity metrics.
 */
exports.getUserEngagementReport = async (query) => {
  // This report could combine data from Users and Checkouts
  // For demonstration, we count checkouts per user.
  const userActivity = await Checkout.findAll({
    attributes: [
      'userId',
      [fn('COUNT', col('id')), 'checkoutCount']
    ],
    group: ['userId'],
    order: [[literal('checkoutCount'), 'DESC']]
  });
  
  return userActivity;
};

/**
 * Financial Report: Summarizes fines, overdue fees, and fine collections.
 */
exports.getFinancialReport = async (query) => {
  const checkouts = await Checkout.findAll({
    attributes: [
      [fn('SUM', col('fine')), 'totalFines']
    ],
    where: {
      fine: { [Op.gt]: 0 }
    }
  });
  
  return checkouts[0];
};

/**
 * Custom Report: Supports ad hoc filters (e.g., date ranges, userId, etc.)
 */
exports.getCustomReport = async (filters) => {
  const where = {};
  if (filters.startDate && filters.endDate) {
    where.checkoutDate = {
      [Op.between]: [new Date(filters.startDate), new Date(filters.endDate)]
    };
  }
  if (filters.userId) where.userId = filters.userId;
  if (filters.bookIsbn) where.bookIsbn = filters.bookIsbn;
  if (filters.status) where.status = filters.status;
  
  const records = await Checkout.findAll({
    where,
    order: [['checkoutDate', 'DESC']]
  });
  
  return records;
};
