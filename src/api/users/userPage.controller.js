const userService = require('./users.service');
const CustomError = require('../../utils/customError');

exports.renderProfilePage = async (req, res, next) => {
  // 1) Make sure we even have a user ID
  if (!req.user || !req.user.id) {
    return res.redirect('/auth/login');
  }

  try {
    // 2) Try to fetch the full user
    const user = await userService.getUserById(req.user.id);

    // 3) If we got here, a user was found—render the page
    return res.render('profile', { user });

  } catch (err) {
    // 4) Handle “user not found” specially
    if (err instanceof CustomError && err.status === 404) {
      // e.g. redirect to a “not found” page or just call next()
      return next();      
    }
    // 5) Anything else is a real error—pass it to your error handler
    return next(err);
  }
};

exports.renderAdminUserDetail = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      // If user not found, render a friendly error page
      next();
    }

    // Render the admin-user-detail.ejs template with full user data
    res.render('admin-user-detail', { user });
  } catch (error) {
    next(error);
  }
};

exports.renderAdminUserEdit = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);                         // parse route param 
    const user = await userService.getUserById(id);                // fetch from DB

    if (!user) {
      // no such user → 404 error page
      next();
    }

    // Render the EJS template "admin-user-edit.ejs"
    res.render('admin-user-edit', { user });                        // render view with user data 
  } catch (err) {
    next(err);
  }
};

exports.renderAdminUserAdd = async (req, res, next) => {
  try {
    // No data needed up-front; just render the form template
    res.render('admin-user-add');
  } catch (error) {
    next(error);
  }
};
