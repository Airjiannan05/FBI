const pool = require('../config/db');

/**
 * 创建订单接口
 * @route POST /api/order
 * @param {number} user_id - 用户ID
 * @param {Array} items - 订单商品数组，每项包含 product_id, quantity, price
 * @param {number} total_price - 订单总价
 * @returns { order_id } 创建成功返回订单ID
 */
exports.create = async (req, res) => {
  const { user_id, items, total_price } = req.body;
  // 参数校验
  if (!user_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: '参数错误' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction(); // 开启事务
    // 插入订单主表
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
      [user_id, total_price, '待支付']
    );
    const orderId = orderResult.insertId;
    // 插入订单商品明细
    for (const item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }
    await conn.commit(); // 提交事务
    res.json({ message: '订单创建成功', order_id: orderId });
  } catch (err) {
    await conn.rollback(); // 回滚事务
    res.status(500).json({ message: '订单创建失败', error: err.message });
  } finally {
    conn.release(); // 释放连接
  }
};

/**
 * 查询订单列表接口
 * @route GET /api/order
 * @query {number} user_id - 可选，指定用户ID只查该用户订单
 * @returns {Array} orders 订单列表
 */
exports.list = async (req, res) => {
  const { user_id } = req.query;
  try {
    let sql = 'SELECT * FROM orders';
    let params = [];
    // 如果传了user_id，则只查该用户订单
    if (user_id) {
      sql += ' WHERE user_id = ?';
      params.push(user_id);
    }
    sql += ' ORDER BY created_at DESC';
    const [orders] = await pool.query(sql, params);
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: '查询订单失败', error: err.message });
  }
};

/**
 * 查询订单详情接口
 * @route GET /api/order/:id
 * @param {number} id - 订单ID
 * @returns {Object} order 订单基本信息
 * @returns {Array} items 订单商品明细
 */
exports.detail = async (req, res) => {
  const { id } = req.params;
  try {
    // 查询订单主表
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: '订单不存在' });
    }
    // 查询订单商品明细，联表查商品名和图片
    const [items] = await pool.query(
      'SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [id]
    );
    res.json({ order: orders[0], items });
  } catch (err) {
    res.status(500).json({ message: '查询订单详情失败', error: err.message });
  }
};
