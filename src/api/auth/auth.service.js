const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const authConfig = require('../../config/auth.config');
const CustomError = require('../../utils/customError');

// Register a new user
exports.registerUser = async (userData) => {
  // Check if the email already exists
  const existingUser = await User.findOne({ where: { email: userData.email } });
  if (existingUser) {
    throw new CustomError('Email already exists.', 409); // 409 Conflict
  }

  // Hash the password before storing it
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
  userData.password = hashedPassword;

  // Create and return the new user
  const newUser = await User.create(userData);
  return newUser;
};

// Login a user and generate a JWT
exports.loginUser = async (credentials) => {
  const { email, password } = credentials;

  // Find the user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new CustomError('User not found.', 404); // 404 Not Found
  }

  // Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid password.', 401); // 401 Unauthorized
  }

  // Generate a JWT token with minimal payload (user id and role)
  const tokenPayload = { id: user.id, role: user.role };
  const token = jwt.sign(tokenPayload, authConfig.secret, { expiresIn: authConfig.expiresIn });

  // Respond with the token in the JSON payload as well (optional)
  return token;
};

exports.logout = async (req, res) => {
  // Clear the token cookie from the client's browser.
  // Adjust cookie options if needed (e.g., domain, path, secure, httpOnly)
  res.clearCookie('jwt_token', { path: '/' });
  console.log('\n\n\nreq.user is ',req.user ,'\n\n\n');
  
  return;
};
