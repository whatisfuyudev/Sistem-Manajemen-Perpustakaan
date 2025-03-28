const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Example routes for reporting endpoints
router.get('/circulation', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getCirculationReport);
router.get('/reservations', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getReservationReport);
router.get('/overdue', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getOverdueReport);
router.get('/inventory', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getInventoryReport);
router.get('/user-engagement', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getUserEngagementReport);
router.get('/financial', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getFinancialReport);
router.get('/custom', authMiddleware.verifyToken, authMiddleware.isAdmin, reportsController.getCustomReport);

module.exports = router;
