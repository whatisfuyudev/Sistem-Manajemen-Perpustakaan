// controllers/admin/articlePage.controller.js
const Article = require('../../models/article.model');

exports.renderAddForm = (req, res, next) => {
  // No article => blank form
  res.render('admin-article-add-or-edit', { article: null });
};

exports.renderEditForm = async (req, res, next) => {
  try {
    const id      = req.params.id;
    const article = await Article.findByPk(id);
    if (!article) {
      return res.status(404).send('Article not found');
    }
    res.render('admin-article-add-or-edit', { article });
  } catch (err) {
    next(err);
  }
};
