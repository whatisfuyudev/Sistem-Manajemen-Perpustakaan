const User = require('../../models/user.model');
const bcrypt = require('bcryptjs'); // Ensure bcrypt is installed

exports.createUser = async (userData) => {
  // Check if a user with the same email already exists
  const existingUser = await User.findOne({ where: { email: userData.email } });
  if (existingUser) {
    throw new Error('Email already exists.');
  }

  // Hash the password before storing it
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
  userData.password = hashedPassword;

  // Create and return the new user
  const newUser = await User.create(userData);
  return newUser;
};

// Get all users
exports.getAllUsers = async () => {
  const users = await User.findAll();
  return users;
};

// Get user by ID
exports.getUserById = async (id) => {
  const user = await User.findByPk(id);
  return user;
};

// Update user by ID (hash password if updated)
exports.updateUser = async (id, updateData) => {
  if (updateData.password) {
    const saltRounds = 10;
    updateData.password = await bcrypt.hash(updateData.password, saltRounds);
  }
  const [affectedCount, affectedRows] = await User.update(updateData, {
    where: { id },
    returning: true,
  });
  if (affectedCount === 0) {
    return null;
  }
  return affectedRows[0];
};

// Delete user by ID
exports.deleteUser = async (id) => {
  const deletedCount = await User.destroy({ where: { id } });
  return deletedCount > 0;
};
