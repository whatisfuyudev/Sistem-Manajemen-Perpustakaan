/**
 * Render the “Add New News” page.
 */
exports.renderAddNewsPage = (req, res, next) => {
  try {
    // If you need to pass any data into the template (e.g. user info), do so here:
    res.render('admin-news-add', {
      // example: currentUser: req.user
    });
  } catch (err) {
    next(err);
  }
};