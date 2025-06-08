const checkoutService = require('./checkouts.service'); // Adjust the path if needed

// Add at top of file:
exports.renderAdminCheckoutAdd = async (req, res, next) => {
  try {
    // You can pass any needed context here
    res.render('admin-checkout-add');
  } catch (err) {
    next(err);
  }
};

exports.renderAdminCheckoutEdit = async (req, res, next) => {
  try {
    const checkoutId = parseInt(req.params.id, 10);

    // Fetch existing record
    const checkout = await checkoutService.getById(checkoutId);
    if (!checkout) {
      next();
    }

    // Render the edit form, passing the existing data
    res.render('admin-checkout-edit', { checkout });
  } catch (err) {
    next(err);
  }
};

exports.renderAdminCheckoutDetail = async (req, res, next) => {
  try {
    // Convert the checkoutId to a number, in case it is passed as a string.
    const checkoutId = req.params.id;
    
    // You may have a service to gather a full set of data for the checkout detail page.
    // For example, this service might fetch checkout data, the associated book info, and user info.
    // Here is a simple example assuming you have such a service function.
    const checkoutDetail = await checkoutService.getCheckoutDetail(parseInt(checkoutId));

    if (!checkoutDetail) {
      next();
    }
    
    // Render the admin-checkout-detail EJS template with the checkout detail data.
    res.render('admin-checkout-detail', checkoutDetail);
  } catch (error) {
    next(error);
  }
};

exports.renderMyCheckouts = async (req, res, next) => {
  try {
    // req.user is populated by authMiddleware.verifyToken.
    // Pass the minimal user data (id and role) to the template.
    res.render('my-checkouts', { user: req.user });
  } catch (error) {
    next(error);
  }
};
