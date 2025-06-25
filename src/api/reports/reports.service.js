const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const sequelize = require('../../utils/db');
const Checkout = require('../../models/checkout.model');
const Reservation = require('../../models/reservation.model');
const Book = require('../../models/book.model');
// Assume you have some utility functions in dateHelper if needed
const { groupByPeriod, buildDateFilter} = require('../../utils/dateHelper');
const { format } = require('date-fns');
const {getBookByISBN} = require('../books/books.service');
const { getDailyFineAmount } = require('../checkouts/checkouts.service');

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

  // 2) aggregate checkouts by book_isbn
  const rows = await Checkout.findAll({
    attributes: [
      'book_isbn',
      [ fn('COUNT', col('book_isbn')), 'checkoutCount' ]                     
    ],
    where: whereClause,
    group: ['book_isbn'],                                                   
    order: [[ literal('"checkoutCount"'), 'DESC' ]],
    limit: parseInt(limit, 10),
    raw: true
  });

  // 3) fetch full book details for each ISBN
  const result = [];
  for (const { book_isbn, checkoutCount } of rows) {

    const book = await getBookByISBN(book_isbn);               
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

  // 2) Aggregate by book_isbn to get checkout counts per book
  const agg = await Checkout.findAll({
    attributes: [
      'book_isbn',
      [ fn('COUNT', col('book_isbn')), 'checkoutCount' ]
    ],
    where: whereClause,
    group: ['book_isbn'],                                                     
    order: [[ literal('"checkoutCount"'), 'DESC' ]],
    raw: true
  });                                                                         

  // If no checkouts, return empty
  if (!agg.length) {
    return { total: 0, popularGenres: [] };
  }

  // 3) Fetch all relevant books in one query
  const isbns = agg.map(r => r.book_isbn);
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
  agg.forEach(({ book_isbn, checkoutCount }) => {
    const genres = genreMap[book_isbn] || [];
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
 */
exports.getOverdueReport = async (query) => {
  // 1) Extract pagination & filter flags
  const page          = query.page  ? parseInt(query.page, 10)  : 1;
  const limit         = query.limit ? parseInt(query.limit, 10) : 10;
  const wantMostFine  = query.mostFine === 'true';
  const wantLeastFine = query.leastFine === 'true';
  const searchId      = query.id    ? parseInt(query.id, 10)   : null;

  // 2) Base overdue criteria (no date filtering)
  const now = new Date();
  const baseWhere = {
    status:  { [Op.in]: ['active', 'overdue'] },
    dueDate: { [Op.lt]: now }
  };
  // 2a) If ID search provided, add exact match
  if (searchId !== null && !isNaN(searchId)) {
    baseWhere.id = searchId;
  }

  // 3) Fetch all matching rows
  const rows = await Checkout.findAll({
    where: baseWhere,
    raw: true
  });

  // 4) Compute overdueDays & overdueFine
  const msPerDay        = 1000 * 60 * 60 * 24;
  const dailyFineAmount = await getDailyFineAmount();
  const enriched = rows.map(co => {
    const dueMs       = new Date(co.dueDate).getTime();
    const overdueMs   = now.getTime() - dueMs;
    const overdueDays = Math.max(0, Math.floor(overdueMs / msPerDay));
    const overdueFine = parseFloat((overdueDays * dailyFineAmount).toFixed(2));
    return {
      id:           co.id,
      bookIsbn:     co.bookIsbn,
      userId:       co.userId,
      dueDate:      co.dueDate,
      overdueDays,
      overdueFine
    };
  });

  // 5) Sort by fine or by id
  enriched.sort((a, b) => {
    if (wantMostFine)   return b.overdueFine - a.overdueFine;
    if (wantLeastFine)  return a.overdueFine - b.overdueFine;
    return b.id - a.id;
  });

  // 6) Paginate
  const totalCount = enriched.length;
  const start      = (page - 1) * limit;
  const paged      = enriched.slice(start, start + limit);

  // 7) Compute total uncollected fine
  const totalUncollectedFine = enriched
    .reduce((sum, r) => sum + r.overdueFine, 0);

  // 8) Return paginated & filtered data
  return {
    overdueCheckouts:      paged,
    page,
    limit,
    totalCount,
    totalUncollectedFine: parseFloat(totalUncollectedFine.toFixed(2))
  };
};



/**
 * Inventory Report: Provides insights into book availability and condition.
 * Pagination added.
 */
exports.getBookInventory = async (query) => {
  const page   = query.page  ? parseInt(query.page, 10)  : 1;
  const limit  = query.limit ? parseInt(query.limit, 10) : 10;
  const offset = (page - 1) * limit;

  // 1) Build optional search filter
  const search = (query.search || '').trim();
  const where  = search
    ? {
        [Op.or]: [
          { isbn:  { [Op.iLike]: `%${search}%` } },   // Postgres case-insensitive
          { title: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : {};

  // 2) Query with pagination + search
  const { rows, count } = await Book.findAndCountAll({
    where,
    attributes: ['isbn', 'title', 'availableCopies', 'totalCopies'],
    order: [['title', 'ASC']],
    limit,
    offset
  });

  return {
    books:      rows,
    page,
    limit,
    totalCount: count
  };
};

/**
 * Inventory Health: Provides insights into overall inventory health.
 */
exports.getInventoryHealth = async ({ page = 1, limit = 50, search = '' }) => {
  page   = parseInt(page, 10);
  limit  = parseInt(limit, 10);
  const offset = (page - 1) * limit;

  // 1) Build optional search filter for books
  const searchFilter = search.trim()
    ? {
        [Op.or]: [
          { isbn:  { [Op.iLike]: `%${search}%` } },  // Postgres iLike
          { title: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : {};

  // 2) Fetch paginated books
  const { count: totalCount, rows: books } = await Book.findAndCountAll({
    where: searchFilter,
    attributes: ['isbn', 'title', 'totalCopies', 'availableCopies'],
    order: [['title', 'ASC']],
    limit,
    offset,
    raw: true
  });

  // 3) Aggregate lost/damaged counts for these ISBNs only
  const isbns = books.map(b => b.isbn);
  const aggRows = isbns.length
    ? await Checkout.findAll({
        attributes: [
          'bookIsbn',
          'status',
          [Checkout.sequelize.fn('COUNT', '*'), 'count']
        ],
        where: {
          bookIsbn: { [Op.in]: isbns },
          status:   { [Op.in]: ['lost', 'damaged'] }
        },
        group: ['bookIsbn', 'status'],
        raw: true
      })
    : [];

  // 4) Build lookup of counts per ISBN
  const countsByIsbn = {};
  aggRows.forEach(({ bookIsbn, status, count }) => {
    if (!countsByIsbn[bookIsbn]) {
      countsByIsbn[bookIsbn] = { lost: 0, damaged: 0 };
    }
    countsByIsbn[bookIsbn][status] = parseInt(count, 10);
  });

  // 5) Merge counts into books, computing good = total – lost – damaged
  const enriched = books.map(b => {
    const { lost = 0, damaged = 0 } = countsByIsbn[b.isbn] || {};
    const good = b.totalCopies - lost - damaged;
    return {
      isbn:            b.isbn,
      title:           b.title,
      totalCopies:     b.totalCopies,
      availableCopies: b.availableCopies,
      conditionCounts: { good, lost, damaged }
    };
  });

  // 6) Return paginated, merged results
  return {
    books:      enriched,
    page,
    limit,
    totalCount
  };
};

function parseSortDirection(sort) {
  if (sort === 'least') return 'ASC';
  // default & “most”
  return 'DESC';
}

/**
 * User Engagement Report: Aggregates user checkout counts.
 */
exports.getUserEngagementReport = async (query) => {
  // 1) Pagination
  const page   = query.page  ? parseInt(query.page, 10) : 1;
  const limit  = query.limit ? parseInt(query.limit, 10) : 10;
  const offset = (page - 1) * limit;

  // 2) Optional userId filter
  const where = {};
  if (query.userId) {
    const uid = parseInt(query.userId, 10);
    if (!isNaN(uid)) where.userId = uid;
  }

  // 3) Date filter on checkoutDate
  Object.assign(where, buildDateFilter(query));

  // 4) Determine sort
  let order;
  if (query.sort === 'most' || query.sort === 'least') {
    // sort by count
    const dir = parseSortDirection(query.sort); // 'DESC' or 'ASC'
    order = [[ fn('COUNT', col('id')), dir ]];
  } else {
    // default sort by userId descending
    order = [['userId', 'DESC']];
  }

  // 5) Aggregate
  const { count: rawCount, rows } = await Checkout.findAndCountAll({
    where,
    attributes: [
      'userId',
      [ fn('COUNT', col('id')), 'checkoutCount' ]
    ],
    group: ['userId'],
    order,
    limit, offset,
    subQuery: false,
    raw: true
  });

  const totalCount = Array.isArray(rawCount) ? rawCount.length : rawCount;

  return {
    userActivity: rows.map(r => ({
      userId:        r.userId,
      checkoutCount: parseInt(r.checkoutCount, 10)
    })),
    page, limit, totalCount
  };
};

/**
 * User Reservations Report: Aggregates user reservation counts.
 */
exports.getUserReservationsReport = async (query) => {
  // 1) Pagination
  const page   = query.page  ? parseInt(query.page, 10) : 1;
  const limit  = query.limit ? parseInt(query.limit, 10) : 10;
  const offset = (page - 1) * limit;

  // 2) Optional userId filter
  const where = {};
  if (query.userId) {
    const uid = parseInt(query.userId, 10);
    if (!isNaN(uid)) where.userId = uid;
  }

  // 3) Remap date filter to requestDate
  const df = buildDateFilter(query);  // yields { checkoutDate: … } or {}
  if (df.checkoutDate) {
    where.requestDate = df.checkoutDate;
  }

  // 4) Determine sort
  let order;
  if (query.sort === 'most' || query.sort === 'least') {
    const dir = parseSortDirection(query.sort);
    order = [[ fn('COUNT', col('id')), dir ]];
  } else {
    // default sort by userId descending
    order = [['userId', 'DESC']];
  }

  // 5) Aggregate
  const { rows, count: rawCount } = await Reservation.findAndCountAll({
    where,
    attributes: [
      'userId',
      [ fn('COUNT', col('id')), 'reservationsCount' ]
    ],
    group: ['userId'],
    order,
    limit, offset,
    subQuery: false,
    raw: true
  });

  const totalCount = Array.isArray(rawCount) ? rawCount.length : rawCount;

  return {
    userReservations: rows.map(r => ({
      userId:            r.userId,
      reservationsCount: parseInt(r.reservationsCount, 10)
    })),
    page, limit, totalCount
  };
};

/**
 * Financial Report: Breaks down fines by source (using 'status').
 * No pagination added as the grouping typically yields few rows.
 */
exports.getFinancialReport = async (query) => {
  // 1) Build optional date filter on checkoutDate
  const dateFilter = buildDateFilter(query);  
  // buildDateFilter returns e.g. { checkoutDate: { [Op.gte]: start, [Op.lte]: end } } or {}

  // 2) Combine with fine > 0
  const where = {
    fine: { [Op.gt]: 0 },
    ...dateFilter
  };

  // 3) Aggregate sum of fines by status
  const rows = await Checkout.findAll({
    attributes: [
      'status',
      [ fn('SUM', col('fine')), 'totalFines' ]
    ],
    where,
    group: ['status'],
    order: [[ fn('SUM', col('fine')), 'DESC' ]],
    raw: true
  });

  // 4) Turn totalFines into numbers and return
  return rows.map(r => ({
    status:      r.status,
    totalFines:  parseFloat(r.totalFines)
  }));
};

