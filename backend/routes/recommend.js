const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommendController');

// 公开
router.get('/also-bought', recommendController.alsoBought);
router.get('/personal', recommendController.personalRecommend);

module.exports = router;
