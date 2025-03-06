// reports.controller.js
const reportsService = require('./reports.service');

exports.getCirculationReport = async (req, res, next) => {
  try {
    // Optional: Accept query parameters (e.g., period = daily, weekly, monthly)
    const period = req.query.period || 'daily';
    const report = await reportsService.getCirculationReport({ period });
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getReservationReport = async (req, res, next) => {
  try {
    const report = await reportsService.getReservationReport(req.query);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getOverdueReport = async (req, res, next) => {
  try {
    const report = await reportsService.getOverdueReport(req.query);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const report = await reportsService.getInventoryReport(req.query);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getUserEngagementReport = async (req, res, next) => {
  try {
    const report = await reportsService.getUserEngagementReport(req.query);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getFinancialReport = async (req, res, next) => {
  try {
    const report = await reportsService.getFinancialReport(req.query);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getCustomReport = async (req, res, next) => {
  try {
    // Accept custom filters like date ranges, userId, bookIsbn, etc.
    const filters = req.query;
    const report = await reportsService.getCustomReport(filters);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};
