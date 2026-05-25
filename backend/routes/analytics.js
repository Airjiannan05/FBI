const express = require('express');
const router = express.Router();
const { optionalToken } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// 浏览记录（可选登录）
router.post('/start-browse', optionalToken, analyticsController.startBrowse);
router.put('/end-browse/:id', optionalToken, analyticsController.endBrowse);
router.post('/browse', optionalToken, analyticsController.recordBrowse);

// 用户画像（仅 admin 可查）
router.get('/profile/:userId', analyticsController.getUserProfile);
router.post('/refresh-profile/:userId', analyticsController.refreshProfile);

module.exports = router;
