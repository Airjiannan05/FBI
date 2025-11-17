const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.list);
router.get('/my', productController.myProducts); // 获取用户的商品列表
router.get('/:id', productController.detail);

// 商品管理操作
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

module.exports = router;
