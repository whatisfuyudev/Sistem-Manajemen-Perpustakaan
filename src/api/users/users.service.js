const User = require('../../models/user.model');
const bcrypt = require('bcryptjs'); // Ensure bcryptjs is installed
const dataHelper = require('../../utils/dataHelper');
const CustomError = require('../../utils/customError');
const { Op } = require('sequelize');
// const logger = require('../../utils/logger');

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

// Get all users that support filtering
exports.getAllUsers = async (query) => {
  // 1) Build dynamic WHERE clause
  const where = {};

  if (query.id) {
    where.id = parseInt(query.id, 10);
  }

  if (query.name) {
    where.name = { [Op.iLike]: `%${query.name}%` };
  }

  if (query.email) {
    where.email = { [Op.iLike]: `%${query.email}%` };
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.address) {
    where.address = { [Op.iLike]: `%${query.address}%` };
  }

  if (query.accountStatus) {
    where.accountStatus = query.accountStatus;
  }

  // 2) Pagination defaults
  const page   = query.page   ? parseInt(query.page,   10) : 1;
  const limit  = query.limit  ? parseInt(query.limit,  10) : 10;
  const offset = (page - 1) * limit;

  // 3) Execute query with count & paginated rows
  const { count, rows } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit
  });

  return {
    total: count,
    users: rows,
    page,
    limit
  };
};

// Get user by ID
exports.getUserById = async (id) => {
  const user = await User.findOne({ where: { id } });
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

  // check whether there is a new profilePicture uploaded and there is a profile picture
    if (updateData.profilePicture && user.profilePicture) {
      // if yes, delete old picture
      // extract folder/public_id from the old URL
      const re    = /\/(profile-pictures\/[^.]+)\.[^/.]+$/;
      const match = user.profilePicture.match(re);

      dataHelper.deleteFile(decodeURIComponent( match[1] ), (err, result) => {
        if (err) {
          // logger.error(err);
        } else {
          // logger.info(`User with id ${user.id} Cloudinary destroy result: ${result}`);
        }
      });
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

/**
 * Bulk‐delete users by an array of IDs.
 * Also deletes their profile pictures if present.
 * @param {number[]} ids
 * @returns {Promise<number>}  the number of deleted rows
 */
exports.bulkDelete = async (ids) => {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new CustomError('No IDs provided for deletion', 400);
  }

  // 1) Fetch matching users so we can delete their pictures
  const users = await User.findAll({
    where: { id: { [Op.in]: ids } },
    attributes: ['id','profilePicture']
  });

  // 2) Delete each profilePicture file
  await Promise.all(users.map(u => {
    if (u.profilePicture) {
      return new Promise(resolve => {
          // extract folder/public_id from the old URL
          const re    = /\/(profile-pictures\/[^.]+)\.[^/.]+$/;
          const match = u.profilePicture.match(re);

          dataHelper.deleteFile(decodeURIComponent( match[1] ), (err, result) => {
            if (err) {
              // logger.error(err);
            } else {
              // logger.info(`User with id ${u.id} Cloudinary destroy result: ${result}`);
            }
            resolve();
          });
      });
    }
    return Promise.resolve();
  }));

  // 3) Delete the DB rows
  const deletedCount = await User.destroy({
    where: { id: { [Op.in]: ids } }
  });

  return deletedCount;
}
