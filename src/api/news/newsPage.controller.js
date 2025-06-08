const { getNewsById, getPublishedById } = require('./news.service');

/**
 * Render the “Add New News” page.
 */
exports.renderAddNewsPage = async (req, res, next) => {
  try {
    // If you need to pass any data into the template (e.g. user info), do so here:
    res.render('admin-news-add', {
      // example: currentUser: req.user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Render the “New News” page.
 */
exports.renderNewsPage = async (req, res, next) => {
  const { id } = req.params;
  const news = await getPublishedById(id);

  if (!news) {
    next();
  }

  try {
    res.render('news-details', {
      news
    });
  } catch (err) {
    next(err);
  }
};


/**
 * Render the “Admin News Detail” page.
 */
exports.renderAdminNewsDetailPage = async (req, res, next) => {
  const { id } = req.params;
  const news = await getNewsById(id);

  if (!news) {
    next();
  }

  try {
    res.render('admin-news-detail', { news });
  } catch (err) {
    next(err);
  }
};

/**
 * Render the “Admin News Edit” page.
 */
exports.renderAdminNewsEditPage = async (req, res, next) => {
  const { id } = req.params;
  const news = await getNewsById(id);

  if (!news) {
    next();
  }

  try {
    res.render('admin-news-edit', { news });
  } catch (err) {
    next(err);
  }
};
