const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/uploadController');

// 配置 multer - 使用内存存储
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // 最多 10 个文件
  }
});

// 上传单张图片
router.post('/image', upload.single('file'), uploadController.uploadSingleImage);

// 上传多张图片
router.post('/images', upload.array('files', 10), uploadController.uploadMultipleImages);

// 删除图片
router.delete('/image', uploadController.deleteImage);

module.exports = router;
