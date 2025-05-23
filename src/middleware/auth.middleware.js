const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

exports.verifyToken = (req, res, next) => {
  // Retrieve token from cookie "jwt_token"
  const token = req.cookies.jwt_token;
  if (!token) {
    return res.status(401).json({ message: 'No token provided, please log in first.' });
  }
  
  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token.' });
    }
    // Save decoded user id and role for use in other middleware/controllers
    req.user = { id: decoded.id, role: decoded.role };
    
    next();
  });
};

// Middleware to ensure user is a Librarian
exports.isLibrarian = (req, res, next) => {
  if (req.user && req.user.role === 'Librarian') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Librarian role required.' });
};

// Middleware to ensure user is an Admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Admin role required.' });
};

exports.isLibrarianOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'Librarian' || req.user.role === 'Admin')) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied. Librarian or Admin role required.' });
};
