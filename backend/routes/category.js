const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// 公开
router.get('/', categoryController.list);

// 需要 seller/admin
router.post('/', verifyToken, requireRole('seller', 'admin'), categoryController.create);
router.put('/:id', verifyToken, requireRole('seller', 'admin'), categoryController.update);
router.delete('/:id', verifyToken, requireRole('seller', 'admin'), categoryController.remove);

module.exports = router;
