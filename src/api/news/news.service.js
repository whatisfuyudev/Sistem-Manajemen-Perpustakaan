// src/services/news.service.js
const { Op } = require('sequelize');
const News     = require('../../models/news.model');

/**
 * Create a new news item.
 * @param {Object} data
 * @returns {Promise<News>}
 */
async function create(data) {
  return await News.create(data);
}

/**
 * Update an existing news item by ID.
 * @param {number|string} id
 * @param {Object} data
 * @throws {Error} if no row was affected
 * @returns {Promise<News>}
 */
async function update(id, data) {
  const [affected] = await News.update(data, { where: { id } });
  if (!affected) {
    throw new Error(`News with id=${id} not found`);
  }
  return await News.findByPk(id);
}

/**
 * Mark a news item published or unpublished.
 * @param {number|string} id
 * @param {boolean} published
 * @throws {Error} if no row was affected
 * @returns {Promise<News>}
 */
async function markPublished(id, published) {
  const [affected] = await News.update(
    { published },
    { where: { id } }
  );
  if (!affected) {
    throw new Error(`News with id=${id} not found`);
  }
  return await News.findByPk(id);
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
 * Search news items by various filters.
 * @param {Object} filters
 * @param {number|string} [filters.id]
 * @param {string} [filters.title]
 * @param {boolean} [filters.published]
 * @param {Date|string} [filters.createdFrom]
 * @param {Date|string} [filters.createdTo]
 * @returns {Promise<News[]>}
 */
async function search(filters = {}) {
  const where = {};

  if (filters.id) {
    where.id = filters.id;
  }
  if (filters.title) {
    where.title = { [Op.iLike]: `%${filters.title}%` };
  }
  if (filters.published !== undefined) {
    where.published = filters.published;
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {};
    if (filters.createdFrom) {
      where.createdAt[Op.gte] = filters.createdFrom;
    }
    if (filters.createdTo) {
      where.createdAt[Op.lte] = filters.createdTo;
    }
  }

  return await News.findAll({
    where,
    order: [['createdAt', 'DESC']]
  });
}

module.exports = {
  create,
  update,
  markPublished,
  getAllPublished,
  search
};
