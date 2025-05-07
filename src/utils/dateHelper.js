// dateHelper.js
const { format, startOfWeek } = require('date-fns');
const { Op } = require('sequelize');

/**
 * Groups an array of data objects by a specified period.
 * Assumes each object has a date property called "checkoutDate".
 *
 * @param {Array} data - Array of objects with a checkoutDate property.
 * @param {string} period - The grouping period: 'daily', 'weekly', or 'monthly'.
 * @returns {Object} An object where keys are formatted dates and values are arrays of items.
 */
exports.groupByPeriod = (data, period) => {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array.');
  }
  
  const grouped = {};
  
  data.forEach(item => {
    // Ensure the item has a valid checkoutDate property.
    if (!item.checkoutDate) return;
    const date = new Date(item.checkoutDate);
    let key = '';
    
    switch (period) {
      case 'daily':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'weekly': {
        // Determine the start of the week (Monday)
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        key = format(weekStart, 'yyyy-MM-dd');
        break;
      }
      case 'monthly':
        key = format(date, 'yyyy-MM');
        break;
      default:
        // Default to daily grouping if period is not recognized
        key = format(date, 'yyyy-MM-dd');
    }
    
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });
  
  return grouped;
};

/**
 * Build a WHERE clause to filter checkoutDate by month-year or year,
 * using Op.gte and Op.lte for an inclusive range.
 *
 * @param {Object} filters
 * @param {string} [filters.month] - "YYYY-MM" (e.g. "2020-01")
 * @param {string} [filters.year]      - "YYYY"      (e.g. "2020")
 * @returns {Object} a Sequelize WHERE fragment
 */
exports.buildDateFilter = ({ month, year }) => {
  // If month provided, parse YYYYand MM
  if (month) {
    let [yyyy, mm] = month.split('-').map(s => parseInt(s, 10));

    if (!isNaN(mm) && !isNaN(yyyy)) {
      // JS months are zero‑based: monthIndex = mm - 1
      const start = new Date(yyyy, mm - 1, 1);                         // first ms of month
      // last day: day 0 of next month yields last day of current month
      const end   = new Date(yyyy, mm, 0, 23, 59, 59, 999);            // last ms of month

      return {
        checkoutDate: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      };
    }
  }

  // Fallback: full‑year filter
  if (year) {
    const y = parseInt(year, 10);
    if (!isNaN(y)) {
      const start = new Date(y, 0, 1);
      const end   = new Date(y + 1, 0, 0, 23, 59, 59, 999);            // Dec 31 end of year

      return {
        checkoutDate: {
          [Op.gte]: start,
          [Op.lte]: end
        }
      };
    }
  }

  // No date filter
  return {};
};