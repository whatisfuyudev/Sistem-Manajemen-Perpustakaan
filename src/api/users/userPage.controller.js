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
      return res.status(404).render('error', { message: 'User not found.' });
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
      return res.status(404).render('error', { message: 'User not found.' });
    }

    // Render the admin-user-detail.ejs template with full user data
    res.render('admin-user-detail', { user });
  } catch (error) {
    next(error);
  }
};

exports.renderAdminUserEdit = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);                         // parse route param :contentReference[oaicite:2]{index=2}
    const user = await userService.getUserById(id);                // fetch from DB

    if (!user) {
      // no such user → 404 error page
      return res.status(404).render('error', { message: 'User not found.' });
    }

    // Render the EJS template "admin-user-edit.ejs"
    res.render('admin-user-edit', { user });                        // render view with user data :contentReference[oaicite:3]{index=3}
  } catch (err) {
    next(err);
  }
};
