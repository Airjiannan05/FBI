const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 公开路由
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// 需要登录
router.get('/profile', verifyToken, userController.profile);

module.exports = router;
