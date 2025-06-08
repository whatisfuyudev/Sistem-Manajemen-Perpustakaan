// services/article.service.js
const { Op } = require('sequelize');
const Article = require('../../models/article.model');
const CustomError = require('../../utils/customError');
const dataHelper = require('../../utils/dataHelper');

/**
 * Create a new article.
 */
async function create(data) {
  return await Article.create(data);
}

/**
 * Update an existing article by ID.
 */
async function update(id, data) {
  const [affected] = await Article.update(data, { where: { id } });
  if (!affected) {
    throw new CustomError(`Article with id=${id} not found`, 404);
  }
  return await Article.findByPk(id);
}

/**
 * Bulk‐delete articles by an array of IDs.
 * @param {Array<number>} ids
 * @returns {Promise<number>}  the number of rows deleted
 */
async function bulkDelete(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new CustomError('No IDs provided for deletion', 400);
  }

  // Optionally, if you want to delete coverImage files from disk:
  const rows = await Article.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id','coverImage']
  });
  await Promise.all(
    rows.map(a => {
      if (a.coverImage) {
        return new Promise(resolve => {
          dataHelper.deleteFile(a.coverImage, err => {
            if (err) console.error(`Error deleting cover for article ${a.id}:`, err);
            resolve();
          });
        });
      }
      return Promise.resolve();
    })
  );

  // Now destroy the DB rows
  const destroyedCount = await Article.destroy({
    where: { id: { [Op.in]: ids } }
  });

  if (destroyedCount === 0) {
    throw new CustomError('No matching articles found to delete', 404);
  }
  return destroyedCount;
}

/**
 * Set published/unpublished for an article.
 */
async function setPublished(id, published) {
  const [affected] = await Article.update(
    { published },
    { where: { id } }
  );
  if (!affected) {
    throw new CustomError(`Article with id=${id} not found`, 404);
  }
  return await Article.findByPk(id);
}

/**
 * Fetch all published articles.
 * If `titleFilter` is provided, run a case‑insensitive LIKE.
 * Sort by `createdAt` according to `sortOrder` ('asc' or 'desc').
 */
async function getAllPublished(titleFilter = null, sortOrder = 'desc') {
  const where = { published: true };
  if (titleFilter) {
    where.title = { [Op.iLike]: `%${titleFilter}%` };
  }

  // Normalize sortOrder to uppercase 'ASC' or 'DESC'
  const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  return await Article.findAll({
    where,
    order: [['createdAt', direction]]
  });
}


/**
 * Admin search: filter by id, title, authorName, published.
 * Supports pagination via page & limit arguments.
 *
 * @param {Object} filters – may contain: id, title, authorName, published
 * @param {number} page    – which page (1‑based)
 * @param {number} limit   – how many items per page
 * @returns {Promise<{ rows: Article[], count: number }>}
 */
async function searchAdmin(filters = {}, page = 1, limit = 10) {
  // Build the WHERE clause from filters
  const where = {};

  if (filters.id) {
    where.id = filters.id;
  }
  if (filters.title) {
    where.title = { [Op.iLike]: `%${filters.title}%` };
  }
  if (filters.authorName) {
    where.authorName = { [Op.iLike]: `%${filters.authorName}%` };
  }
  if (filters.published !== undefined) {
    where.published = filters.published;
  }

  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Use findAndCountAll to retrieve rows + total count in one call
  const result = await Article.findAndCountAll({
    where,
    order: [['id', 'DESC']],
    limit,
    offset
  });

  // result.rows = matching articles for this page
  // result.count = total matching count (ignore offset/limit)
  return {
    rows: result.rows,
    count: result.count
  };
}

module.exports = {
  create,
  update,
  bulkDelete,
  setPublished,
  getAllPublished,
  searchAdmin
};
