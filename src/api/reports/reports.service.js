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
 * (Pagination is less critical here since the aggregation typically results in few groups.)
 */
exports.getCirculationReport = async ({ period }) => {
  const checkouts = await Checkout.findAll({
    attributes: ['id', 'checkoutDate']
  });
  
  const grouped = groupByPeriod(checkouts, period);
  
  const aggregated = Object.keys(grouped).map(key => ({
    date: key,
    totalCheckouts: grouped[key].length
  }));
  
  aggregated.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  return { period, checkouts: aggregated };
};

/**
 * Reservation Report: Lists reservations segmented by status.
 * Pagination added.
 */
exports.getReservationReport = async (query) => {
  const where = {};
  if (query.userId) where.userId = query.userId;
  if (query.bookIsbn) where.bookIsbn = query.bookIsbn;

  const page = query.page ? parseInt(query.page) : 1;
  const limit = query.limit ? parseInt(query.limit) : 10;
  const offset = (page - 1) * limit;

  // Use findAndCountAll for pagination
  const { rows, count } = await Reservation.findAndCountAll({
    where,
    order: [['requestDate', 'DESC']],
    limit,
    offset
  });

  // For grouped status, we calculate from all reservations (without pagination)
  const allReservations = await Reservation.findAll({ where });
  const grouped = allReservations.reduce((acc, res) => {
    acc[res.status] = (acc[res.status] || 0) + 1;
    return acc;
  }, {});

  return { reservations: rows, groupedByStatus: grouped, page, limit, totalCount: count };
};

/**
 * Overdue Report: Identifies overdue checkouts and aggregates overdue metrics.
 * Pagination added.
 */
exports.getOverdueReport = async (query) => {
  const now = new Date();
  const page = query.page ? parseInt(query.page) : 1;
  const limit = query.limit ? parseInt(query.limit) : 10;
  const offset = (page - 1) * limit;
  
  const { rows, count } = await Checkout.findAndCountAll({
    where: {
      status: { [Op.in]: ['active', 'overdue'] },
      dueDate: { [Op.lt]: now }
    },
    order: [['dueDate', 'ASC']],
    limit,
    offset
  });
  
  const totalFine = rows.reduce((sum, checkout) => {
    return sum + parseFloat(checkout.fine || 0);
  }, 0);
  
  return { overdueCheckouts: rows, totalFine, page, limit, totalCount: count };
};

/**
 * Inventory Report: Provides insights into book availability and condition.
 * Pagination added.
 */
exports.getInventoryReport = async (query) => {
  const page = query.page ? parseInt(query.page) : 1;
  const limit = query.limit ? parseInt(query.limit) : 10;
  const offset = (page - 1) * limit;
  
  const { rows, count } = await Book.findAndCountAll({
    attributes: ['isbn', 'title', 'availableCopies', 'totalCopies'],
    order: [['title', 'ASC']],
    limit,
    offset
  });
  return { books: rows, page, limit, totalCount: count };
};

/**
 * User Engagement Report: Aggregates user activity metrics.
 * Pagination added.
 */
exports.getUserEngagementReport = async (query) => {
  const page = query.page ? parseInt(query.page) : 1;
  const limit = query.limit ? parseInt(query.limit) : 10;
  const offset = (page - 1) * limit;
  
  const result = await Checkout.findAndCountAll({
    attributes: [
      'userId',
      [fn('COUNT', col('id')), 'checkoutCount']
    ],
    group: ['userId'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    limit,
    offset,
    subQuery: false
  });

  // If result.count is an array (due to grouping), take its length
  const totalCount = Array.isArray(result.count) ? result.count.length : result.count;
  
  return { userActivity: result.rows, page, limit, totalCount };
};


/**
 * Financial Report: Breaks down fines by source (using 'status').
 * No pagination added as the grouping typically yields few rows.
 */
exports.getFinancialReport = async (query) => {
  const fineBreakdown = await Checkout.findAll({
    attributes: [
      'status',
      [fn('SUM', col('fine')), 'totalFines']
    ],
    where: {
      fine: { [Op.gt]: 0 }
    },
    group: ['status'],
    order: [[fn('SUM', col('fine')), 'DESC']]
  });
  
  return fineBreakdown;
};

/**
 * Custom Report: Supports ad hoc filters (e.g., date ranges, userId, etc.)
 * Pagination added.
 */
exports.getCustomReport = async (filters) => {
  const where = {};
  let endDate;
  if (filters.endDate) {
    endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
  }

  if (filters.startDate && filters.endDate) {
    where.checkoutDate = {
      [Op.between]: [new Date(filters.startDate), endDate]
    };
  } else if (filters.startDate) {
    where.checkoutDate = {
      [Op.gte]: new Date(filters.startDate)
    };
  } else if (filters.endDate) {
    where.checkoutDate = {
      [Op.lte]: endDate
    };
  }
  
  if (filters.userId) where.userId = filters.userId;
  if (filters.bookIsbn) where.bookIsbn = filters.bookIsbn;
  if (filters.status) where.status = filters.status;
  
  const page = filters.page ? parseInt(filters.page) : 1;
  const limit = filters.limit ? parseInt(filters.limit) : 10;
  const offset = (page - 1) * limit;
  
  const { rows, count } = await Checkout.findAndCountAll({
    where,
    order: [['checkoutDate', 'DESC']],
    limit,
    offset
  });
  
  return { records: rows, page, limit, totalCount: count };
};
