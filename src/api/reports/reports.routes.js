const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Example routes for reporting endpoints
router.get('/circulation', authMiddleware.verifyToken, reportsController.getCirculationReport);
router.get('/reservations', authMiddleware.verifyToken, reportsController.getReservationReport);
router.get('/overdue', authMiddleware.verifyToken, reportsController.getOverdueReport);
router.get('/inventory', authMiddleware.verifyToken, reportsController.getInventoryReport);
router.get('/user-engagement', authMiddleware.verifyToken, reportsController.getUserEngagementReport);
router.get('/financial', authMiddleware.verifyToken, reportsController.getFinancialReport);
router.get('/custom', authMiddleware.verifyToken, reportsController.getCustomReport);

module.exports = router;
