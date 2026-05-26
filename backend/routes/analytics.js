const express = require('express');
const router = express.Router();
const { optionalToken, verifyToken, requireRole } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// 浏览记录（可选登录）
router.post('/start-browse', optionalToken, analyticsController.startBrowse);
router.put('/end-browse/:id', optionalToken, analyticsController.endBrowse);
router.post('/end-browse/:id', optionalToken, analyticsController.endBrowse);
router.post('/browse', optionalToken, analyticsController.recordBrowse);

// 用户画像
router.get('/profile/:userId', analyticsController.getUserProfile);
router.post('/refresh-profile/:userId', analyticsController.refreshProfile);

// 浏览/购买日志（销售人员及以上可查）
router.get('/browse-logs', verifyToken, requireRole('seller', 'admin'), analyticsController.getBrowseLogs);
router.get('/purchase-logs', verifyToken, requireRole('seller', 'admin'), analyticsController.getPurchaseLogs);
router.get('/users', verifyToken, requireRole('seller', 'admin'), analyticsController.getUsers);

module.exports = router;
