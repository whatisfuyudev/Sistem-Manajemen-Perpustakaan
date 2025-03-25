const User = require('../../models/user.model');
const bcrypt = require('bcryptjs'); // Ensure bcryptjs is installed
const dataHelper = require('../../utils/dataHelper');
const CustomError = require('../../utils/customError');

// to create user with admin role
// modify directly in database (currently the only way)
exports.createUser = async (userData) => {
  // Check if a user with the same email already exists
  const existingUser = await User.findOne({ where: { email: userData.email } });
  if (existingUser) {
    throw new CustomError('Email already exists.', 409);
  }

  if (userData.role === 'Admin') {
    throw new CustomError('Creating Admin user is prohibited.', 403);
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
  if (!user) {
    throw new CustomError('User not found.', 404);
  }
  return user;
};

// Update user by ID (hash password if updated)
exports.updateUser = async (id, updateData) => {
  const user = await User.findOne({ where: { id } });

  if (!user) {
    throw new CustomError('User not found.', 404);
  }

  if (updateData.password) {
    const saltRounds = 10;
    updateData.password = await bcrypt.hash(updateData.password, saltRounds);
  }

  // check whether there is a new profilePicture uploaded
    if (updateData.profilePicture) {
      // if yes, delete old picture
      dataHelper.deleteFile(user.profilePicture, (err) => {
        if (err) {
          console.error('Error deleting file:', err);
          return null;
        }
      });
    }

  if (updateData.role === 'Admin') {
    throw new CustomError('Updating user role to Admin is prohibited.', 403);
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
