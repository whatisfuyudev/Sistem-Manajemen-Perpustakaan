module.exports = {
  secret: process.env.JWT_SECRET || 'myVerySecretKeyHehe',
  expiresIn: '4h', // Token expiration time (e.g., 1 hour)
};
