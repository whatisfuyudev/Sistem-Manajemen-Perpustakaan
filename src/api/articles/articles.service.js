// services/article.service.js
const { Op } = require('sequelize');
const Article = require('../../models/article.model');
const CustomError = require('../../utils/customError');
const dataHelper = require('../../utils/dataHelper');
const logger = require('../../utils/logger');

const WORDS_PER_MINUTE = 150;

function countWordsInDelta(delta) {
  let text = '';
  // Delta.ops is an array of { insert: string|object, attributes?... }
  for (const op of delta.ops || []) {
    if (typeof op.insert === 'string') {
      text += op.insert;
    }
  }
  // simple split on whitespace
  const words = text
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);
  return words.length;
}

/**
 * Create a new article, validating presence of required data
 * and auto-computing readingTime if omitted.
 *
 * @param {Object} data
 * @returns {Promise<Article>}
 * @throws CustomError(…,400) if required data is missing
 */
async function create(data) {
  // 1) Validate required fields
  if (!data.title) {
    throw new CustomError('Title is required', 400);
  }
  if (!data.body) {
    throw new CustomError('Body (quill Delta) is required', 400);
  }
  if (!data.authorName) {
    throw new CustomError('Author name is required', 400);
  }

  // 2) Auto-compute readingTime if not provided
  if (data.readingTime == null) {
    let delta;
    try {
      // Our controller may have stringified JSON or actual object
      delta = typeof data.body === 'string'
        ? JSON.parse(data.body)
        : data.body;
    } catch (e) {
      delta = { ops: [] };
    }
    const wordCount = countWordsInDelta(delta);
    // at least one minute
    data.readingTime = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  }

  // 3) Finally, persist
  return await Article.create(data);
}

/**
 * Update an existing article by ID.
 */
async function update(id, data) {
  // 1) Fetch existing record
  const article = await Article.findByPk(id);
  if (!article) {
    throw new CustomError(`Article with id=${id} not found`, 404);
  }

  // 2) If a new coverImage URL was provided, delete the old file
  //    (we assume data.coverImage holds the new URL/path)
  if (data.coverImage && article.coverImage) {
    dataHelper.deleteFile(article.coverImage, err => {
      if (err) {
        logger.error(`Error deleting old cover for article ${id}:\n`+ JSON.stringify(err));
      }
    });
  }

  // 3) Perform the update, requesting the new row back
  const [affectedRows] = await Article.update(
    data,
    {
      where: { id },
      returning: true
    }
  );

  // 4) Return the updated instance
  return affectedRows[0];
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
            if (err) logger.error(`Error deleting cover for article ${a.id}:\n`+ JSON.stringify(err));
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
 * Bulk‐set published/unpublished.
 * @param {number[]} ids
 * @param {boolean} published
 * @returns {Promise<number>} number of rows updated
 */
async function bulkSetPublished(ids, published) {
  const [affected] = await Article.update(
    { published },
    { where: { id: { [Op.in]: ids } } }
  );

  if (affected === 0) {
    throw new CustomError('No matching articles found to update', 404);
  }

  return affected;
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
  bulkSetPublished,
  getAllPublished,
  searchAdmin
};
