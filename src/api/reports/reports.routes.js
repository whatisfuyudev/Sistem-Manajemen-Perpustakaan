const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// Example routes for reporting endpoints
router.get('/circulation', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getCirculationReport);
router.get('/popular/books', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getPopularBooks);
router.get('/popular/genres', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getPopularGenres);

router.get('/overdue', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getOverdueReport);


router.get('/inventory/book', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getBookInventory);
router.get('/inventory/health', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getInventoryHealth);


router.get('/user/engagement/checkouts', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getUserEngagementReport);
router.get(
  '/user/engagement/reservations',
  authMiddleware.verifyToken,
  authMiddleware.isLibrarianOrAdmin,
  reportsController.getReservationsReport
);


router.get('/financial', authMiddleware.verifyToken, authMiddleware.isLibrarianOrAdmin, reportsController.getFinancialReport);

module.exports = router;
