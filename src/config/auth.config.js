module.exports = {
  secret: process.env.JWT_SECRET || 'myVerySecretKeyHehe',
  expiresIn: '1d', // Token expiration time (e.g., 1 day)
};
