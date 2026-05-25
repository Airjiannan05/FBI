const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// 需要登录
router.post('/', verifyToken, orderController.create);
router.get('/', verifyToken, orderController.list);
router.get('/:id', verifyToken, orderController.detail);
router.post('/:id/pay', verifyToken, orderController.pay);

// 需要 seller/admin 角色
router.post('/:id/ship', verifyToken, requireRole('seller', 'admin'), orderController.ship);

module.exports = router;
