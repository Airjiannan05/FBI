const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// 获取商家销售订单列表
router.get('/orders', salesController.getSellerOrders);

// 获取销售统计数据
router.get('/statistics', salesController.getSalesStatistics);

// 获取商品销售详情
router.get('/product/:productId', salesController.getProductSalesDetail);

module.exports = router;
