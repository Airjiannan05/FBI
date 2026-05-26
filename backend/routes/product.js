const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const productController = require('../controllers/productController');

// 公开路由
router.get('/', productController.list);

// 需要登录的路由
router.get('/my', verifyToken, productController.myProducts);

router.get('/:id', productController.detail);

// 需要 seller/admin 角色
router.post('/', verifyToken, requireRole('seller', 'admin'), productController.create);
router.put('/:id', verifyToken, requireRole('seller', 'admin'), productController.update);
router.delete('/:id', verifyToken, requireRole('seller', 'admin'), productController.remove);

module.exports = router;
