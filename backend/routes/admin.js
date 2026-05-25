const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// 所有路由仅 admin
router.get('/sales', verifyToken, requireRole('admin'), adminController.getSalesList);
router.post('/sales', verifyToken, requireRole('admin'), adminController.addSales);
router.delete('/sales/:id', verifyToken, requireRole('admin'), adminController.removeSales);
router.post('/reset-password/:id', verifyToken, requireRole('admin'), adminController.resetPassword);
router.get('/statistics/overview', verifyToken, requireRole('admin'), adminController.getGlobalOverview);
router.get('/statistics/trend', verifyToken, requireRole('admin'), adminController.getGlobalTrend);

module.exports = router;
