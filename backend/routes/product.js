const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.list);
router.get('/:id', productController.detail);

// 管理员操作
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

module.exports = router;
