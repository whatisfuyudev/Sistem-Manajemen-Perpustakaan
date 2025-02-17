const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

exports.verifyToken = (req, res, next) => {
  // Retrieve token from Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Invalid token format.' });
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
