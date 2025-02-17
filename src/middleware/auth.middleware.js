const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');

exports.verifyToken = (req, res, next) => {
  
  // Retrieve token from cookie "jwt_token"
  const token = req.cookies.jwt_token;
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  console.log('auth works, token = ', token);
  
  jwt.verify(token, authConfig.secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Failed to authenticate token.' });
    }
    // Save decoded user id and role for use in other middleware/controllers
    req.user = { id: decoded.id, role: decoded.role };
    
    
    next();
  });
};
