/**
 * 鉴权中间件
 * 提供 JWT 验证和角色权限控制
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

/**
 * 验证 JWT Token，将用户信息注入 req.user
 * 如果 token 无效，返回 401
 */
function verifyToken(req, res, next) {
  const auth = req.headers['authorization'];
  
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录，请先登录' });
  }
  
  const token = auth.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;  // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
}

/**
 * 生成角色权限工厂函数
 * @param  {...string} roles 允许的角色列表
 * @returns {Function} Express 中间件
 * 
 * 用法：
 *   router.post('/product', verifyToken, requireRole('seller', 'admin'), productController.create);
 */
function requireRole(...roles) {
  return (req, res, next) => {
    // 必须先经过 verifyToken 中间件
    if (!req.user) {
      return res.status(401).json({ message: '未登录' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `权限不足，需要 [${roles.join(', ')}] 角色` 
      });
    }
    
    next();
  };
}

/**
 * 可选的 Token 验证（不强制要求登录）
 * 如果有有效 token 则注入 req.user，没有则继续但不注入
 */
function optionalToken(req, res, next) {
  const auth = req.headers['authorization'];
  
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // token 无效也不报错，继续执行
    }
  }
  
  next();
}

module.exports = {
  verifyToken,
  requireRole,
  optionalToken,
  JWT_SECRET
};
