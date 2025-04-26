const userService = require('./users.service');

exports.createUser = async (req, res, next) => {
  try {
    // Remove any empty fields
    const data = req.body;
    Object.keys(data).forEach(key => {
      const val = data[key];
      const isEmptyString = typeof val === 'string' && val.trim() === '';
      const isEmptyArray  = Array.isArray(val) && val.length === 0;
      const isNullish     = val == null; // catches null or undefined
      if (isNullish || isEmptyString || isEmptyArray) {
        delete data[key];
      }
    });

    // Expect user data in req.body
    const newUser = await userService.createUser(data);
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
      
      res.json({ profilePicture: `/public/images/profile-pictures/${req.file.filename}`});
    }
  } catch (error) {
    next(error);
  }
}

exports.deleteUser = async (req, res, next) => {
  try {
    const deleted = await userService.deleteUser(req.params.id);
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(404).json({ message: 'User not found or deletion not permitted' });
    }
  } catch (error) {
    next(error);
  }
};
