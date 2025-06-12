// controllers/article.controller.js
const ArticleService = require('./articles.service');

exports.handleArticlePictureUpload = async (req, res, next) => { 
  try {
    if(req.isImageUploadSuccesful) {
      
      res.json({ articlesPicture: `/public/images/articles-pictures/${req.file.filename}`});
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new article.
 */
exports.createArticle = async (req, res, next) => {
  try {
    const data = { ...req.body };
    // strip empty strings or nulls
    Object.keys(data).forEach(key => {
      const v = data[key];
      if ((typeof v === 'string' && v.trim() === '') || v == null) {
        delete data[key];
      }
    });
    const article = await ArticleService.create(data);
    res.status(201).json(article);
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing article.
 */
exports.updateArticle = async (req, res, next) => {
  try {
    const data = { ...req.body };
    // strip empty fields
    Object.keys(data).forEach(key => {
      const v = data[key];
      if ((typeof v === 'string' && v.trim() === '') || v == null) {
        delete data[key];
      }
    });
    const updated = await ArticleService.update(req.params.id, data);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk‐delete articles (Admin only).
 * Expects JSON body: { ids: [1, 2, 3] }
 */
exports.bulkDeleteArticles = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const deletedCount = await ArticleService.bulkDelete(ids);
    res.status(200).json({
      message: `Deleted ${deletedCount} article${deletedCount !== 1 ? 's' : ''}.`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk‐publish/unpublish articles.
 * Expects JSON body: { ids: [1,2,3], published: true|false }
 */
exports.bulkSetPublished = async (req, res, next) => {
  try {
    const { ids, published } = req.body;
    if (!Array.isArray(ids) || ids.length === 0 || typeof published !== 'boolean') {
      return res.status(400).json({
        message: 'Must provide `ids` array and boolean `published` flag'
      });
    }
    const count = await ArticleService.bulkSetPublished(ids, published);
    res.status(200).json({
      message: `${count} article${count !== 1 ? 's' : ''} ${
        published ? 'published' : 'unpublished'
      }`
    });
  } catch (err) {
    next(err);
  }
};


/**
 * List all published articles, with optional `title` filter
 * and optional `order` parameter ('asc' or 'desc').
 */
exports.listPublished = async (req, res, next) => {
  try {
    const titleFilter = req.query.title || null;
    // Accept `order=asc` or `order=desc` (case‑insensitive). Default to 'desc'.
    let orderParam = (req.query.order || 'desc').toLowerCase();
    if (orderParam !== 'asc' && orderParam !== 'desc') {
      orderParam = 'desc';
    }

    const list = await ArticleService.getAllPublished(
      titleFilter,
      orderParam  // pass 'asc' or 'desc'
    );
    res.status(200).json(list);
  } catch (err) {
    next(err);
  }
};


/**
 * Admin search: by id, title, authorName, published, with pagination.
 *
 * Query parameters supported:
 *   - id (integer)
 *   - title (string, partial match)
 *   - authorName (string, partial)
 *   - published (true/false)
 *   - page (integer, default = 1)
 *   - limit (integer, default = 10)
 */
exports.searchAdmin = async (req, res, next) => {
  try {
    // 1) Extract filters from the incoming query
    const rawFilters = { ...req.query };

    // 2) Parse ID if provided
    if (rawFilters.id) {
      rawFilters.id = parseInt(rawFilters.id, 10);
    }

    // 3) Parse published flag if provided
    if (rawFilters.published !== undefined) {
      rawFilters.published = rawFilters.published === 'true';
    }

    // 4) Parse pagination parameters (default to page=1, limit=10)
    const page  = parseInt(rawFilters.page, 10)  >= 1 ? parseInt(rawFilters.page, 10)  : 1;
    const limit = parseInt(rawFilters.limit, 10) >= 1 ? parseInt(rawFilters.limit, 10) : 10;

    // 5) Remove page & limit from filter object before passing to service
    delete rawFilters.page;
    delete rawFilters.limit;

    // 6) Call service to search with filters + pagination
    const { rows, count } = await ArticleService.searchAdmin(rawFilters, page, limit);

    // 7) Send back a paginated response
    res.status(200).json({
      articles: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    next(err);
  }
};
