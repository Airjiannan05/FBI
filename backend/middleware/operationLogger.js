/**
 * 操作日志中间件
 * 拦截所有 CUD (Create/Update/Delete) 操作，写入 operation_logs 表
 */
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// 定义需要记录的操作类型映射（路由路径 -> 操作类型）
const operationMap = {
  // Product
  'POST:/api/product': 'add_product',
  'PUT:/api/product': 'update_product',
  'DELETE:/api/product': 'delete_product',
  // Category
  'POST:/api/category': 'add_category',
  'PUT:/api/category': 'update_category',
  'DELETE:/api/category': 'delete_category',
  // Order
  'POST:/api/order': 'create_order',
  'POST:/api/order/pay': 'pay_order',
  'POST:/api/order/ship': 'ship_order',
  // Admin
  'POST:/api/admin/sales': 'add_seller',
  'DELETE:/api/admin/sales': 'remove_seller',
  'POST:/api/admin/reset-password': 'reset_password',
};

function operationLogger(req, res, next) {
  // 只记录写操作
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  // 构建操作键
  const routePath = req.baseUrl + req.route?.path || req.originalUrl;

  // 从 token 中提取用户信息
  let userId = null;
  const auth = req.headers['authorization'];
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(auth.replace('Bearer ', ''), JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      // token 无效，不记录
    }
  }

  // 拦截响应，记录操作
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    // 只在操作成功时记录（状态码 2xx）
    if (res.statusCode >= 200 && res.statusCode < 300 && userId) {
      const key = `${req.method}:${req.baseUrl}`;
      const operationType = findOperationType(req.method, req.baseUrl, req.path);

      pool.query(
        'INSERT INTO operation_logs (user_id, operation_time, operation_type, content, ip_address, target_type, target_id) VALUES (?, NOW(), ?, ?, ?, ?, ?)',
        [
          userId,
          operationType,
          `${req.method} ${req.originalUrl}`,
          req.ip || req.connection.remoteAddress || '',
          operationType.split('_')[1] || '',
          req.params.id || null
        ]
      ).catch(err => {
        console.error('记录操作日志失败:', err.message);
      });
    }

    return originalJson(body);
  };

  next();
}

function findOperationType(method, baseUrl, path) {
  // 精确匹配
  const exactKey = `${method}:${baseUrl}`;
  if (operationMap[exactKey]) return operationMap[exactKey];

  // 模糊匹配（如 /api/product/ship 匹配 POST:/api/product）
  if (method === 'POST' && path.includes('/pay')) return 'pay_order';
  if (method === 'POST' && path.includes('/ship')) return 'ship_order';
  if (method === 'POST' && path.includes('/reset-password')) return 'reset_password';

  // 默认
  const parts = baseUrl.split('/').filter(Boolean);
  const resource = parts[1] || 'unknown';
  const actions = { POST: 'add', PUT: 'update', DELETE: 'delete' };
  return `${actions[method] || 'modify'}_${resource}`;
}

module.exports = operationLogger;
