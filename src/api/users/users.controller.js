const userService = require('./users.service');

exports.createUser = async (req, res, next) => {
  try {
    if(req.isImageUploadSuccesful) {
      req.body.profilePicture = `/public/images/profile-pictures/${req.file.filename}`;
    }

    // Expect user data in req.body
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
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
    const updatedUser = await userService.updateUser(req.params.id, req.body);
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
