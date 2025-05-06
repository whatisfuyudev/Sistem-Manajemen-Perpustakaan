const { Op, fn, col, literal } = require('sequelize');
const Checkout = require('../../models/checkout.model');
const Reservation = require('../../models/reservation.model');
const Book = require('../../models/book.model');
const User = require('../../models/user.model');
// Assume you have some utility functions in dateHelper if needed
const { groupByPeriod, buildDateFilter } = require('../../utils/dateHelper');
const { format } = require('date-fns');
const CustomError = require('../../utils/customError');
const {getBookByISBN} = require('../books/books.service');

/**
 * Circulation Report: Aggregates checkouts, renewals, returns, and overdue transactions.
 * Accepts a period filter: 'daily', 'weekly', 'monthly'
 * (Pagination is less critical here since the aggregation typically results in few groups.)
 */
exports.getCirculationReport = async ({ period, month, year }) => {
  // apply default
  const now = new Date();
  if ((period === 'daily' || period === 'weekly') && !month) {
    // default to current YYYY-MM
    month = format(now, 'yyyy-MM');
  }
  if (period === 'monthly' && !year) {
    // default to current YYYY
    year = format(now, 'yyyy');

  }
  
  // Build a WHERE clause
  const where = {};

  if (month) {
    // month is "YYYY-MM"; match any day in that month
    // e.g. ["2025-05-01", "2025-05-31"]
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 0, 23, 59, 59, 999);
    where.checkoutDate = { [Op.between]: [start, end] };
  } else if (year) {
    // year-only filter
    const y = parseInt(year, 10);
    const start = new Date(y, 0, 1);
    const end   = new Date(y, 11, 31, 23, 59, 59, 999);
    where.checkoutDate = { [Op.between]: [start, end] };
    
  }
  
  // Fetch only the filtered checkouts
  const checkouts = await Checkout.findAll({
    attributes: ['checkoutDate'],
    where
  });

  // Group and aggregate
  const grouped = groupByPeriod(checkouts, period);
  const aggregated = Object.entries(grouped).map(([key, arr]) => ({
    date: key,
    totalCheckouts: arr.length
  }));

  // Sort descending by date
  aggregated.sort((a, b) => new Date(b.date) - new Date(a.date));

  return { period, month, year, checkouts: aggregated };
};

exports.getPopularBooks = async (filters) => {
  const { limit = 10 } = filters;
  // 1) date filter
  const dateFilter = buildDateFilter(filters);
  const whereClause = dateFilter ? { [Op.and]: [dateFilter] } : {};

  // 2) aggregate checkouts by bookIsbn
  const rows = await Checkout.findAll({
    attributes: [
      'bookIsbn',
      [ fn('COUNT', col('bookIsbn')), 'checkoutCount' ]                     
    ],
    where: whereClause,
    group: ['bookIsbn'],                                                   
    order: [[ literal('"checkoutCount"'), 'DESC' ]],
    limit: parseInt(limit, 10),
    raw: true
  });

  // 3) fetch full book details for each ISBN
  const result = [];
  for (const { bookIsbn, checkoutCount } of rows) {

    const book = await getBookByISBN(bookIsbn);               
    if (book) {
      result.push({ book, checkoutCount: parseInt(checkoutCount, 10) });
    }
  }
  

  return { total: result.length, popularBooks: result };
};

exports.getPopularGenres = async (filters) => {
  const { limit = 10 } = filters;

  // 1) Build WHERE for checkoutDate
  const dateFilter = buildDateFilter(filters);                                
  const whereClause = dateFilter ? { ...dateFilter } : {};                

  // 2) Aggregate by bookIsbn to get checkout counts per book
  const agg = await Checkout.findAll({
    attributes: [
      'bookIsbn',
      [ fn('COUNT', col('bookIsbn')), 'checkoutCount' ]
    ],
    where: whereClause,
    group: ['bookIsbn'],                                                     
    order: [[ literal('"checkoutCount"'), 'DESC' ]],
    raw: true
  });                                                                         

  // If no checkouts, return empty
  if (!agg.length) {
    return { total: 0, popularGenres: [] };
  }

  // 3) Fetch all relevant books in one query
  const isbns = agg.map(r => r.bookIsbn);
  const books = await Book.findAll({
    where: { isbn: { [Op.in]: isbns } },
    attributes: ['isbn','genres'],
    raw: true
  });                                                                        

  // 4) Build a map isbn → genres array
  const genreMap = {};  
  books.forEach(b => {                                                      
    genreMap[b.isbn] = Array.isArray(b.genres) ? b.genres : [];            
  });

  // 5) Tally genre counts, weighting by each book’s checkoutCount
  const counts = {};
  agg.forEach(({ bookIsbn, checkoutCount }) => {
    const genres = genreMap[bookIsbn] || [];
    genres.forEach(g => {
      const genre = g.trim();
      counts[genre] = (counts[genre] || 0) + parseInt(checkoutCount, 10);
    });
  });                                                                        

  // 6) Sort genres by count desc and take top N
  const sorted = Object.entries(counts)
    .map(([genre, count]) => ({ genre, count }))
    .sort((a,b) => b.count - a.count)
    .slice(0, parseInt(limit, 10));                                          

  return { total: sorted.length, popularGenres: sorted };
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

