const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/', orderController.create);
router.get('/', orderController.list);
router.get('/:id', orderController.detail);
router.post('/:id/pay', orderController.pay);
router.post('/:id/ship', orderController.ship);

module.exports = router;
