const pool = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * 获取所有销售人员列表
 * @route GET /api/admin/sales
 */
exports.getSalesList = async (req, res) => {
  try {
    const [sellers] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.created_at,
              COALESCE(up.total_spent, 0) as total_sales,
              COALESCE(up.order_count, 0) as order_count
       FROM users u
       LEFT JOIN user_profile up ON u.id = up.user_id
       WHERE u.role IN ('seller', 'admin')
       ORDER BY u.created_at DESC`
    );
    res.json({ sellers });
  } catch (err) {
    res.status(500).json({ message: '查询失败', error: err.message });
  }
};

/**
 * 添加销售人员（将用户角色设为 seller）
 * @route POST /api/admin/sales
 */
exports.addSales = async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    return res.status(400).json({ message: '缺少用户ID' });
  }
  try {
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    if (users[0].role === 'admin') {
      return res.status(400).json({ message: '不能将管理员降级为销售人员' });
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['seller', user_id]);
    res.json({ message: '销售人员添加成功' });
  } catch (err) {
    res.status(500).json({ message: '操作失败', error: err.message });
  }
};

/**
 * 删除销售人员（将用户角色改回 buyer）
 * @route DELETE /api/admin/sales/:id
 */
exports.removeSales = async (req, res) => {
  const { id } = req.params;
  try {
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    if (users[0].role === 'admin') {
      return res.status(400).json({ message: '不能删除管理员' });
    }
    if (users[0].role !== 'seller') {
      return res.status(400).json({ message: '该用户不是销售人员' });
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', ['buyer', id]);
    res.json({ message: '销售人员已移除' });
  } catch (err) {
    res.status(500).json({ message: '操作失败', error: err.message });
  }
};

/**
 * 管理员重置销售人员密码
 * @route POST /api/admin/reset-password/:id
 */
exports.resetPassword = async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ message: '新密码至少6位' });
  }
  try {
    const [users] = await pool.query('SELECT id, role FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, id]);
    res.json({ message: '密码重置成功' });
  } catch (err) {
    res.status(500).json({ message: '密码重置失败', error: err.message });
  }
};

/**
 * 全局销售业绩概览
 * @route GET /api/admin/statistics/overview
 */
exports.getGlobalOverview = async (req, res) => {
  try {
    // 总体统计
    const [totalStats] = await pool.query(
      `SELECT 
         COUNT(DISTINCT o.id) as total_orders,
         COALESCE(SUM(o.total_price), 0) as total_sales,
         COUNT(DISTINCT o.user_id) as total_buyers,
         COUNT(DISTINCT p.id) as total_products
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.status IN ('已支付', '已发货', '已完成')`
    );

    // 按销售人员统计
    const [sellerStats] = await pool.query(
      `SELECT u.id, u.username,
         COUNT(DISTINCT o.id) as order_count,
         COALESCE(SUM(oi.quantity * oi.price), 0) as total_sales
       FROM users u
       LEFT JOIN order_items oi ON u.id = oi.seller_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('已支付', '已发货', '已完成')
       WHERE u.role IN ('seller', 'admin')
       GROUP BY u.id, u.username
       ORDER BY total_sales DESC`
    );

    // 按类别统计
    const [categoryStats] = await pool.query(
      `SELECT c.id, c.name,
         COUNT(DISTINCT o.id) as order_count,
         COALESCE(SUM(oi.quantity * oi.price), 0) as total_sales,
         COALESCE(SUM(oi.quantity), 0) as total_quantity
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('已支付', '已发货', '已完成')
       GROUP BY c.id, c.name
       ORDER BY total_sales DESC`
    );

    res.json({
      overview: totalStats[0],
      sellerStats,
      categoryStats
    });
  } catch (err) {
    res.status(500).json({ message: '获取全局统计失败', error: err.message });
  }
};

/**
 * 全局销售趋势
 * @route GET /api/admin/statistics/trend
 */
exports.getGlobalTrend = async (req, res) => {
  const { period = 'day', days = 30 } = req.query;
  try {
    let dateFormat, dateInterval;
    switch (period) {
      case 'week': dateFormat = '%Y-%u'; dateInterval = `INTERVAL ${parseInt(days) * 7} DAY`; break;
      case 'month': dateFormat = '%Y-%m'; dateInterval = `INTERVAL ${parseInt(days) * 30} DAY`; break;
      default: dateFormat = '%Y-%m-%d'; dateInterval = `INTERVAL ${parseInt(days)} DAY`; break;
    }

    const [trendData] = await pool.query(
      `SELECT DATE_FORMAT(o.created_at, '${dateFormat}') as date,
         COUNT(DISTINCT o.id) as order_count,
         COALESCE(SUM(o.total_price), 0) as sales_amount
       FROM orders o
       WHERE o.status IN ('已支付', '已发货', '已完成')
       AND o.created_at >= DATE_SUB(NOW(), ${dateInterval})
       GROUP BY DATE_FORMAT(o.created_at, '${dateFormat}')
       ORDER BY date ASC`
    );

    // 按状态统计订单数
    const [statusStats] = await pool.query(
      `SELECT status, COUNT(*) as count, COALESCE(SUM(total_price), 0) as amount
       FROM orders GROUP BY status`
    );

    // 商品排行榜 Top 10
    const [topProducts] = await pool.query(
      `SELECT p.id, p.name, p.image_url, p.price,
         COALESCE(SUM(oi.quantity), 0) as sold_count,
         COALESCE(SUM(oi.quantity * oi.price), 0) as sales_amount
       FROM products p
       INNER JOIN order_items oi ON p.id = oi.product_id
       INNER JOIN orders o ON oi.order_id = o.id AND o.status IN ('已支付', '已发货', '已完成')
       GROUP BY p.id, p.name, p.image_url, p.price
       ORDER BY sold_count DESC
       LIMIT 10`
    );

    res.json({ trend: trendData, statusStats, topProducts });
  } catch (err) {
    res.status(500).json({ message: '获取趋势数据失败', error: err.message });
  }
};
