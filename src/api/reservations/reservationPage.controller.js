// src/api/reservations/reservationPage.controller.js
const path = require('path');

exports.renderMyReservationsPage = async (req, res, next) => {
  try {
    // req.user should have the minimal user information (id, role)
    if (!req.user || !req.user.id) {
      // Redirect to login if no valid token exists
      return res.redirect('/auth/login');
    }
    
    // send the my reservation page
    res.sendFile(path.join(__dirname, '../../../public', 'myReservations.html'));
  } catch (error) {
    next(error);
  }
};

