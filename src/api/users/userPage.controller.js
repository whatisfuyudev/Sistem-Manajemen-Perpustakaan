const userService = require('./users.service');

// src/api/users/user.controller.js
exports.renderProfilePage = async (req, res, next) => {
  try {
    // req.user should have the minimal user information (id, role)
    if (!req.user || !req.user.id) {
      // Redirect to login if no valid token exists
      return res.redirect('/auth/login');
    }
    
    // Fetch full user details from the database using the service
    const user = await userService.getUserById(req.user.id);
    if (!user) {
      next();
    }
    
    // Render the profile page (profile.ejs) with the full user data
    res.render('profile', { user });
  } catch (error) {
    next(error);
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
