// src/services/news.service.js
const { Op } = require('sequelize');
const News     = require('../../models/news.model');
const CustomError = require('../../utils/customError');
const dataHelper = require('../../utils/dataHelper');
const logger = require('../../utils/logger');

/**
 * Create a new news item.
 * @param {Object} data
 * @returns {Promise<News>}
 */
async function create(data) {
  return await News.create(data);
}

/**
 * Retrieve a single published news item by ID.
 * @param {number|string} id
 * @returns {Promise<News|null>}
 */
async function getPublishedById(id) {
  return await News.findOne({
    where: {
      id,
      published: true
    }
  });
}

/**
 * Update an existing news item by ID.
 * @param {number|string} id
 * @param {Object} data
 * @throws {Error} if no row was affected
 * @returns {Promise<News>}
 */
async function update(id, data) {
  const news = await News.findOne({ where: { id } });

  if (!news) {
    throw new CustomError(`News with id=${id} not found`, 404);
  }
  
  if (data.imageUrl) {
      // extract folder/public_id from the old URL
      const re    = /\/(news-pictures\/[^.]+)\.[^/.]+$/;
      const match = news.imageUrl.match(re);

      dataHelper.deleteFile(decodeURIComponent( match[1] ), (err, result) => {
        if (err) {
          logger.error(err);
        } else {
          logger.info(`News with id ${news.id} Cloudinary destroy result: ${result}`);
        }
      });
    }

  const [affectedCount, affectedRows] = await News.update(data, { 
    where: { id }, 
    returning: true, 
  });

  if (affectedCount === 0) {
    return null;
  }
  
  return affectedRows[0];
}

/**
 * Bulk‐mark published/unpublished for multiple news items.
 * @param {number[]} ids
 * @param {boolean} published
 * @returns {Promise<number>} number of rows affected
 */
async function bulkMarkPublished(ids, published) {
  // 1) Update all in one query
  const [affected] = await News.update(
    { published },
    { where: { id: { [Op.in]: ids } } }
  );

  // 2) If none were updated, it might be invalid IDs
  if (affected === 0) {
    throw new CustomError('No matching news items found', 404);
  }

  return affected;
}

/**
 * Retrieve all published news, newest first.
 * @returns {Promise<News[]>}
 */
async function getAllPublished() {
  return await News.findAll({
    where: { published: true },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Search news items by various filters and return paginated results.
 *
 * @param {Object} params
 * @param {number|string} [params.id]            - Exact news ID to match.
 * @param {string} [params.title]                - Partial match on title (ILIKE).
 * @param {boolean} [params.published]           - Filter by published status.
 * @param {Date|string} [params.createdFrom]      - Include news created at or after this date.
 * @param {Date|string} [params.createdTo]        - Include news created at or before this date.
 * @param {number|string} [params.page=1]        - Page number (1-based).
 * @param {number|string} [params.limit=10]      - Number of items per page.
 * @returns {Promise<Object>}                    - Resolves to an object:
 *    {
 *      total: <number>,   // total matching rows
 *      news:  <News[]>,   // array of News instances for this page
 *      page:  <number>,   // current page number
 *      limit: <number>    // page size
 *    }
 */
async function search(params = {}) {
  // 1) Destructure pagination & filters
  const page  = params.page  ? parseInt(params.page, 10)  : 1;
  const limit = params.limit ? parseInt(params.limit, 10) : 10;
  const offset = (page - 1) * limit;

  // 2) Build dynamic WHERE clause
  const where = {};
  if (params.id) {
    // ensure numeric
    where.id = parseInt(params.id, 10);
  }
  if (params.title) {
    where.title = { [Op.iLike]: `%${params.title}%` };
  }
  if (params.published !== undefined) {
    where.published = params.published;
  }
  if (params.createdFrom || params.createdTo) {
    where.createdAt = {};
    if (params.createdFrom) {
      where.createdAt[Op.gte] = params.createdFrom;
    }
    if (params.createdTo) {
      where.createdAt[Op.lte] = params.createdTo;
    }
  }

  // 3) Perform paginated query with count
  const { count, rows } = await News.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit
  });

  // 4) Return total, page, limit, and the rows
  return {
    total: count,
    news: rows,
    page,
    limit
  };
}

/**
 * Retrieve a single news by id. for internal use
 */
async function getNewsById (id) {
  const news = await News.findOne({ where: { id } });
  return news;
};

/**
 * Bulk‐delete news items by an array of IDs,
 * removing their image files first.
 * @param {Array<number>} ids
 * @returns {Promise<number>}  the number of rows deleted
 */
async function bulkDelete(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new CustomError('No IDs provided for deletion', 400);
  }

  // 1) Fetch all matching news rows (only need imageUrl)
  const rows = await News.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id','imageUrl']
  });  

  // 2) For each row, delete its image file if present
  await Promise.all(rows.map(n => {
    if (n.imageUrl) {
      // dataHelper.deleteFile(path, cb) → wrap in a promise
      // extract the public_id
      const url = n.imageUrl;
      const re    = /\/(news-pictures\/[^.]+)\.[^/.]+$/;
      const match = url.match(re);

      return new Promise(resolve => {
          dataHelper.deleteFile(decodeURIComponent( match[1] ), err => {
            if (err) logger.error(`Error deleting news picture for id ${n.imageUrl}:\n` + JSON.stringify(err));
            resolve();
          });
        // dataHelper.deleteFile(n.imageUrl, err => {
        //   if (err) {
        //     logger.error(`Error deleting file for news ${n.id}:\n` + JSON.stringify(err));
        //   }
        //   // resolve no matter what so one failure doesn't abort all
        //   resolve();
        // });
      });
    }
    return Promise.resolve();
  }));

  // 3) Now destroy the DB rows
  const destroyedCount = await News.destroy({
    where: { id: { [Op.in]: ids } }
  });

  return destroyedCount;
}

module.exports = {
  create,
  update,
  bulkMarkPublished,
  getAllPublished,
  search,
  getPublishedById,
  bulkDelete,
  getNewsById
};
