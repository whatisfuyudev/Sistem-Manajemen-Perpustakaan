const authService = require('./auth.service');

exports.register = async (req, res, next) => {
  try {
    // Expect user data in req.body
    const newUser = await authService.registerUser(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Expect credentials (email, password) in req.body
    const token = await authService.loginUser(req.body);
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};
