// backend/utils/ossUpload.js
const OSS = require('ali-oss');
const path = require('path');

// 创建 OSS 客户端
const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_ACCESS_KEY_ID,
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
  bucket: process.env.OSS_BUCKET
});

/**
 * 上传图片到阿里云 OSS
 * @param {Buffer|String} file - 文件 Buffer 或本地路径
 * @param {String} originalName - 原始文件名
 * @param {String} folder - 存储文件夹（如 'products', 'avatars'）
 * @returns {Promise<String>} 返回图片的公网访问 URL
 */
async function uploadImage(file, originalName, folder = 'products') {
  try {
    // 生成唯一文件名：时间戳 + 随机数 + 原始扩展名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(originalName);
    const fileName = `${folder}/${timestamp}-${random}${ext}`;
    
    // 上传到 OSS
    const result = await client.put(fileName, file);
    
    // 返回公网访问 URL
    return result.url;
  } catch (error) {
    console.error('OSS 上传失败:', error);
    throw new Error('图片上传失败');
  }
}

/**
 * 删除 OSS 上的图片
 * @param {String} url - 图片完整 URL
 * @returns {Promise<void>}
 */
async function deleteImage(url) {
  try {
    // 从 URL 中提取文件路径
    const urlObj = new URL(url);
    const fileName = urlObj.pathname.substring(1); // 去掉开头的 '/'
    
    await client.delete(fileName);
    console.log('删除图片成功:', fileName);
  } catch (error) {
    console.error('OSS 删除失败:', error);
    throw new Error('图片删除失败');
  }
}

/**
 * 批量上传图片
 * @param {Array} files - 文件数组
 * @param {String} folder - 存储文件夹
 * @returns {Promise<Array<String>>} 返回所有图片的 URL 数组
 */
async function uploadMultipleImages(files, folder = 'products') {
  try {
    const uploadPromises = files.map((file, index) => {
      const originalName = file.originalname || `image-${index}.jpg`;
      return uploadImage(file.buffer || file.path, originalName, folder);
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('批量上传失败:', error);
    throw new Error('批量图片上传失败');
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  uploadMultipleImages
};