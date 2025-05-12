// src/api/checkouts/checkouts.controller.js
const checkoutsService = require('./checkouts.service');

exports.initiateCheckout = async (req, res, next) => {
  try {
    // Merge req.body with role from req.user
    const checkout = await checkoutsService.initiateCheckout({ ...req.body });
    res.status(201).json(checkout);
  } catch (error) {
    next(error);
  }
};

exports.processReturn = async (req, res, next) => {
  try {
    // Expects { checkoutId, returnDate? } in req.body
    const result = await checkoutsService.processReturn(req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.requestRenewal = async (req, res, next) => {
  try {
    const checkoutId = req.params.id;
    // Pass the request body data (e.g., renewalOption, customDays) to the service
    const result = await checkoutsService.requestRenewal(checkoutId, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.renewCheckout = async (req, res, next) => {
  try {
    // Expects checkout ID in req.params.id and any additional data in req.body if needed
    const result = await checkoutsService.renewCheckout(req.params.id, req.body);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

exports.getCheckoutHistory = async (req, res, next) => {
  try {
    // Pass query parameters and the authenticated user's data to the service
    const history = await checkoutsService.getCheckoutHistory(req.query, req.user);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

exports.updateAdminCheckout = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  const updates = {
    userId:               req.body.userId,
    bookIsbn:             req.body.bookIsbn,
    checkoutDate:         req.body.checkoutDate,
    dueDate:              req.body.dueDate,
    returnDate:           req.body.returnDate || null,
    status:               req.body.status,
    renewalCount:         req.body.renewalCount,
    fine:                 req.body.fine,
    renewalRequested:     req.body.renewalRequested === 'true',
    requestedRenewalDays: req.body.requestedRenewalDays || null
  };
  try {
    await checkoutsService.updateCheckout(id, updates, req.user);
    res.status(200).json({ message: 'Checkout updated successfully' });
  } catch (err) {
    next(err);
  }
};

// maybe latter
// exports.markDamagedRepaired = async (req, res, next) => {
//   try {
//     const result = await checkoutsService.markDamagedRepaired(req.params.id);
//     res.status(200).json(result);
//   } catch (err) {
//     next(err);
//   }
// };

// exports.markLostReplaced = async (req, res, next) => {
//   try {
//     const result = await checkoutsService.markLostReplaced(req.params.id);
//     res.status(200).json(result);
//   } catch (err) {
//     next(err);
//   }
// };
