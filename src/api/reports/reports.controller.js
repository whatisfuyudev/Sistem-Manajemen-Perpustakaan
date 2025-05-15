// reports.controller.js
const reportsService = require('./reports.service');

exports.getCirculationReport = async (req, res, next) => {
  try {
    const {
      period = 'daily',
      month,      // ex: "2025-05"
      year        // ex: "2025"
    } = req.query;

    // Pass month/year through to the service
    const report = await reportsService.getCirculationReport({ period, month, year });
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getPopularBooks = async (req, res, next) => {
  try {
    // Pass the query string (monthYear or year, plus optional limit) into the service
    const result = await reportsService.getPopularBooks(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

exports.getPopularGenres = async (req, res, next) => {
  try {
    const result = await reportsService.getPopularGenres(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
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

exports.getBookInventory = async (req, res, next) => {
  try {
    const report = await reportsService.getBookInventory(req.query);
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

exports.getInventoryHealth = async (req, res, next) => {
  try {
    const report = await reportsService.getInventoryHealth(req.query);
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

exports.getReservationsReport = async (req, res, next) => {
  try {
    const report = await reportsService.getUserReservationsReport(req.query);
    res.status(200).json(report);
  } catch (err) {
    next(err);
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

