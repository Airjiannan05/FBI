const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.detail);

module.exports = router;
