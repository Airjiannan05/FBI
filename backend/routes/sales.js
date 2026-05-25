const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const salesController = require('../controllers/salesController');

// 需要 seller/admin 角色
router.get('/orders', verifyToken, requireRole('seller', 'admin'), salesController.getSellerOrders);
router.get('/statistics', verifyToken, requireRole('seller', 'admin'), salesController.getSalesStatistics);
router.get('/product/:productId', verifyToken, requireRole('seller', 'admin'), salesController.getProductSalesDetail);

// 预测、异常检测、排行榜
router.get('/prediction', verifyToken, requireRole('seller', 'admin'), salesController.getPrediction);
router.get('/anomalies', verifyToken, requireRole('seller', 'admin'), salesController.getAnomalies);
router.get('/ranking', salesController.getRanking);

module.exports = router;
