// src/controllers/news.controller.js
const NewsService = require('./news.service');

/**
 * Get a single published news item by ID.
 */
exports.getByIdPublic = async (req, res, next) => {
  try {
    const item = await NewsService.getPublishedById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'News not found' });
    }
    res.status(200).json(item);
  } catch (err) {
    next(err);
  }
};

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
 * Bulk‐mark published/unpublished.
 * Expects JSON body: { ids: [1,2,3], published: true|false }
 */
exports.bulkMarkPublished = async (req, res, next) => {
  try {
    const { ids, published } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || typeof published !== 'boolean') {
      return res.status(400).json({ message: 'Must provide `ids` array and boolean `published`' });
    }
    const count = await NewsService.bulkMarkPublished(ids, published);
    res.status(200).json({
      message: `${count} item${count!==1?'s':''} ${published?'published':'unpublished'}`
    });
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
    // 1) Extract pagination params (page & limit)
    const page  = req.query.page  ? parseInt(req.query.page, 10)  : 1;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;

    // 2) Build filters exactly as before (excluding page/limit)
    const filters = {
      id: req.query.id,
      title: req.query.title,
      published: req.query.published !== undefined 
                 ? req.query.published === 'true' 
                 : undefined,
      createdFrom: req.query.createdFrom ? new Date(req.query.createdFrom) : undefined,
      createdTo:   req.query.createdTo   ? new Date(req.query.createdTo)   : undefined,
    };

    // 3) Call service with filters + pagination
    const result = await NewsService.search({
      ...filters,
      page,
      limit
    });

    // 4) Return paginated payload
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.handleNewsPictureUpload = async (req, res, next) => { 
  try {
    if(req.isImageUploadSuccesful) {
      
      res.json({ newsPicture: `/public/images/news-pictures/${req.file.filename}`});
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk‐delete news items (Admin only).
 * Expects a JSON body: { ids: [1,2,3] }
 */
exports.bulkDeleteNews = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const count = await NewsService.bulkDelete(ids);
    res.status(200).json({
      message: `Deleted ${count} news item${count !== 1 ? 's' : ''}.`
    });
  } catch (err) {
    next(err);
  }
};