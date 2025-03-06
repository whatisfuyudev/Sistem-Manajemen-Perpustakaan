// dateHelper.js
const { format, startOfWeek } = require('date-fns');

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
