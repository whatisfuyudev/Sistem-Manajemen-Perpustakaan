const checkoutService = require('./checkouts.service'); // Adjust the path if needed

exports.renderAdminCheckoutDetail = async (req, res, next) => {
  try {
    console.log('\n\n\n', req.params, ': req.params\n\n\n');
    // Convert the checkoutId to a number, in case it is passed as a string.
    const checkoutId = req.params.id;

    console.log('\n\n\n', checkoutId, ': checkout id\n\n\n');
    
    
    // You may have a service to gather a full set of data for the checkout detail page.
    // For example, this service might fetch checkout data, the associated book info, and user info.
    // Here is a simple example assuming you have such a service function.
    const checkoutDetail = await checkoutService.getCheckoutDetail(checkoutId);
    
    console.log('\n\n\n', checkoutDetail, ': checckout detail\n\n\n');

    if (!checkoutDetail) {
      return res.status(404).send('<h1>Checkout not found</h1>');
    }
    
    // Render the admin-checkout-detail EJS template with the checkout detail data.
    res.render('admin-checkout-detail', { checkoutDetail });
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
