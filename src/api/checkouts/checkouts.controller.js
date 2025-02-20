// src/api/checkouts/checkouts.controller.js
const checkoutsService = require('./checkouts.service');

exports.initiateCheckout = async (req, res, next) => {
  try {
    // Expects { userId, bookIsbn, role } in req.body
    const checkout = await checkoutsService.initiateCheckout(req.body);
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
    const history = await checkoutsService.getCheckoutHistory(req.query);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};
