// src/controllers/news.controller.js
const NewsService = require('./news.service');

/**
 * Create a news item.
 */
exports.createNews = async (req, res, next) => {
  try {
    // Remove empty values
    const data = { ...req.body };
    Object.keys(data).forEach(key => {
      const val = data[key];
      const isEmptyString = typeof val === 'string' && val.trim() === '';
      const isEmptyArray  = Array.isArray(val) && val.length === 0;
      const isNullish     = val == null; // null or undefined
      if (isEmptyString || isEmptyArray || isNullish) {
        delete data[key];
      }
    });

    const newNews = await NewsService.create(data);
    res.status(201).json(newNews);
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing news item.
 */
exports.updateNews = async (req, res, next) => {
  try {
    const data = { ...req.body };
    // Remove empty fields
    Object.keys(data).forEach(key => {
      const val = data[key];
      const isEmptyString = typeof val === 'string' && val.trim() === '';
      const isEmptyArray  = Array.isArray(val) && val.length === 0;
      const isNullish     = val == null;
      if (isEmptyString || isEmptyArray || isNullish) {
        delete data[key];
      }
    });

    const updated = await NewsService.update(req.params.id, data);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a news item published/unpublished.
 */
exports.markPublished = async (req, res, next) => {
  try {
    // Expect a boolean query or body parameter `published`
    const published = req.body.published ?? req.query.published;
    if (published == null) {
      return res.status(400).json({ message: 'Missing `published` flag' });
    }

    const result = await NewsService.markPublished(
      req.params.id,
      published === 'true' || published === true
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all published news, newest first.
 */
exports.getAllPublished = async (req, res, next) => {
  try {
    const list = await NewsService.getAllPublished();
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};

/**
 * Search news items by filters.
 */
exports.searchNews = async (req, res, next) => {
  try {
    // Build a filters object directly from query
    const filters = { ...req.query };
    // Convert published flag if present
    if (filters.published !== undefined) {
      filters.published = filters.published === 'true';
    }
    // Convert date filters to Date objects if needed
    if (filters.createdFrom) filters.createdFrom = new Date(filters.createdFrom);
    if (filters.createdTo)   filters.createdTo   = new Date(filters.createdTo);

    const results = await NewsService.search(filters);
    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};
