const { uploadImage, deleteImage } = require('../utils/ossUpload');

/**
 * 上传单张图片
 * POST /api/upload/image
 * Content-Type: multipart/form-data
 * Body: { file: File }
 */
exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: '只支持 JPG、PNG、GIF、WEBP 格式的图片' });
    }
    
    // 验证文件大小（最大 5MB）
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ message: '图片大小不能超过 5MB' });
    }
    
    // 上传到 OSS
    const folder = req.body.folder || 'products'; // 可以指定文件夹
    const imageUrl = await uploadImage(req.file.buffer, req.file.originalname, folder);
    
    res.json({
      success: true,
      message: '图片上传成功',
      url: imageUrl
    });
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json({ message: '图片上传失败', error: error.message });
  }
};

/**
 * 上传多张图片
 * POST /api/upload/images
 * Content-Type: multipart/form-data
 * Body: { files: File[] }
 */
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }
    
    // 验证文件数量（最多 10 张）
    if (req.files.length > 10) {
      return res.status(400).json({ message: '一次最多上传 10 张图片' });
    }
    
    const uploadPromises = req.files.map(async (file) => {
      // 验证文件类型和大小
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(`${file.originalname} 格式不支持`);
      }
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`${file.originalname} 大小超过 5MB`);
      }
      
      const folder = req.body.folder || 'products';
      return await uploadImage(file.buffer, file.originalname, folder);
    });
    
    const imageUrls = await Promise.all(uploadPromises);
    
    res.json({
      success: true,
      message: '图片上传成功',
      urls: imageUrls
    });
  } catch (error) {
    console.error('批量上传图片失败:', error);
    res.status(500).json({ message: '图片上传失败', error: error.message });
  }
};

/**
 * 删除图片
 * DELETE /api/upload/image
 * Body: { url: String }
 */
exports.deleteImage = async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: '请提供要删除的图片 URL' });
    }
    
    await deleteImage(url);
    
    res.json({
      success: true,
      message: '图片删除成功'
    });
  } catch (error) {
    console.error('删除图片失败:', error);
    res.status(500).json({ message: '图片删除失败', error: error.message });
  }
};
