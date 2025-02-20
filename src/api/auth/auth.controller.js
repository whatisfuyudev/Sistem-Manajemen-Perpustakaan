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

    // Set the JWT as an HTTP-only cookie named "jwt_token"
    res.cookie('jwt_token', token, {
      httpOnly: true, // Not accessible via client-side JavaScript
      secure: true, // Only send over HTTPS in production
      maxAge: new Date(Date.now() + 8 * 3600000) // Expires in 1 day
    });

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authService.logout(req, res);
    // Respond with a 200 status and a JSON message
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};
