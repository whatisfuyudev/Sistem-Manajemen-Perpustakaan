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

exports.viewArticle = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const article = await Article.findOne({
      where: {
        id
      }
    });
    if (!article) {
      next();
    }
    res.render('admin-article-detail', { article });
  } catch (err) {
    next(err);
  }
};

exports.viewPublishedArticle = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const article = await Article.findOne({
      where: {
        id,
        published: true
      }
    });
    if (!article) {
      next();
    }
    res.render('article-details', { article });
  } catch (err) {
    next(err);
  }
};
