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

exports.loginUser = async (credentials) => {
  const { email, password } = credentials;

  // 1) Find the user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  // 2) Check account status
  if (user.accountStatus !== 'Active') {
    // 403 Forbidden is appropriate for an authenticated but disallowed user
    throw new CustomError(
      `Account is ${user.accountStatus}. Please contact support.`,
      403
    );
  }

  // 3) Compare the provided password with the stored hashed password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new CustomError('Invalid password.', 401);
  }

  // 4) Generate a JWT token with minimal payload (user id and role)
  const tokenPayload = { id: user.id, role: user.role };
  const token = jwt.sign(tokenPayload, authConfig.secret, {
    expiresIn: authConfig.expiresIn
  });

  return token;
};

exports.logout = async (req, res) => {
  // Clear the token cookie from the client's browser.
  // Adjust cookie options if needed (e.g., domain, path, secure, httpOnly)
  res.clearCookie('jwt_token', { path: '/' });

  return;
};
