exports.renderMyCheckouts = async (req, res, next) => {
  try {
    // req.user is populated by authMiddleware.verifyToken.
    // Pass the minimal user data (id and role) to the template.
    res.render('my-checkouts', { user: req.user });
  } catch (error) {
    next(error);
  }
};
