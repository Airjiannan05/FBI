const express = require('express');
const router = express.Router();
const { optionalToken, verifyToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// 浏览记录（可选登录）
router.post('/start-browse', optionalToken, analyticsController.startBrowse);
router.put('/end-browse/:id', optionalToken, analyticsController.endBrowse);
router.post('/browse', optionalToken, analyticsController.recordBrowse);

// 用户画像
router.get('/profile/:userId', analyticsController.getUserProfile);
router.post('/refresh-profile/:userId', analyticsController.refreshProfile);

// 浏览/购买日志（销售人员及以上可查）
router.get('/browse-logs', verifyToken, analyticsController.getBrowseLogs);
router.get('/purchase-logs', verifyToken, analyticsController.getPurchaseLogs);
router.get('/users', verifyToken, analyticsController.getUsers);

module.exports = router;
