const userService = require('./users.service');

exports.createUser = async (req, res, next) => {
  try {
    // 1) Direct object log
    console.log('Incoming body:', req.body);

    // 2) Or JSON.stringify
    console.log('Incoming body (pretty):\n', JSON.stringify(req.body, null, 2));

    const data = { ...req.body };  // clone so delete operations don’t mutate original

    Object.keys(data).forEach(key => {
      const val = data[key];
      if (
        val == null ||
        (typeof val === 'string' && val.trim() === '') ||
        (Array.isArray(val) && val.length === 0)
      ) {
        delete data[key];
      }
    });

    console.log('Sanitized data:\n', data);

    const newUser = await userService.createUser(data);

    // Log the returned user object the same way:
    console.log('Created user:\n', JSON.stringify(newUser, null, 2));

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};


exports.getAllUsers = async (req, res, next) => {
  try {
    // Pass the entire query object to the service
    const result = await userService.getAllUsers(req.query);

    // Send back paginated payload
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    let id;
    if (req.user) {
      id = req.user.id;      
    } else {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const user = await userService.getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.getUserByIdAdmin = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    let id;
    if (req.user) {
      id = req.user.id;      
    } else {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    const updatedUser = await userService.updateUser(id, req.body);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or update failed' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

exports.updateUserAdmin = async (req, res, next) => {
  try {
    const data = req.body;

    // Remove any empty fields
    Object.keys(data).forEach(key => {
      const val = data[key];
      const isEmptyString = typeof val === 'string' && val.trim() === '';
      const isEmptyArray  = Array.isArray(val) && val.length === 0;
      const isNullish     = val == null; // catches null or undefined
      if (isNullish || isEmptyString || isEmptyArray) {
        delete data[key];
      }
    });

    const updatedUser = await userService.updateUser(req.params.id, data);
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found or update failed' });
    }
    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

exports.handleProfilePictureUpload = async (req, res, next) => { 
  try {
    if(req.isImageUploadSuccesful) {
      res.json({ profilePicture: req.fileUrl});
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Bulk‐delete users.
 * Expects JSON body: { ids: [1,2,3] }
 */
exports.bulkDeleteUsers = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No user IDs provided' });
    }
    const deletedCount = await userService.bulkDelete(ids);
    res.status(200).json({
      message: `Deleted ${deletedCount} user${deletedCount !== 1 ? 's' : ''}`
    });
  } catch (err) {
    next(err);
  }
};
