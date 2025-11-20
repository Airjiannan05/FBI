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
    
    // 1. 检查库存并锁定商品行（FOR UPDATE）
    for (const item of items) {
      const [products] = await conn.query(
        'SELECT stock FROM products WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      
      if (products.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: `商品ID ${item.product_id} 不存在` });
      }
      
      const currentStock = products[0].stock;
      if (currentStock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ 
          message: `商品库存不足，当前库存：${currentStock}，需要：${item.quantity}` 
        });
      }
    }
    
    // 2. 插入订单主表
    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
      [user_id, total_price, '待支付']
    );
    const orderId = orderResult.insertId;
    
    // 3. 插入订单商品明细并扣减库存
    for (const item of items) {
      // 获取商品的卖家ID
      const [product] = await conn.query(
        'SELECT user_id FROM products WHERE id = ?',
        [item.product_id]
      );
      const sellerId = product[0]?.user_id || null;
      
      // 插入订单商品明细(包含seller_id)
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, sellerId, item.quantity, item.price]
      );
      
      // 扣减商品库存
      await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
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

/**
 * 支付订单接口
 * @route POST /api/order/:id/pay
 * @param {number} id - 订单ID
 * @param {string} payment_method - 支付方式 (alipay/wechat/card)
 * @returns {Object} 支付结果
 */
exports.pay = async (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;
  const emailUtil = require('../utils/email');
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // 查询订单
    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态
    if (order.status !== '待支付') {
      await conn.rollback();
      return res.status(400).json({ message: '订单状态不正确，无法支付' });
    }
    
    // 模拟支付处理（实际项目中需要对接支付网关）
    // 这里直接标记为支付成功
    const paymentTime = new Date();
    await conn.query(
      'UPDATE orders SET status = ?, payment_method = ?, payment_time = ? WHERE id = ?',
      ['已支付', payment_method, paymentTime, id]
    );
    
    // 查询用户邮箱
    const [users] = await conn.query('SELECT email, username FROM users WHERE id = ?', [order.user_id]);
    
    // 查询订单商品明细
    const [items] = await conn.query(
      'SELECT oi.*, p.name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [id]
    );
    
    await conn.commit();
    
    // 发送订单确认邮件（异步，不阻塞响应）
    if (users.length > 0 && users[0].email) {
      emailUtil.sendOrderConfirmation(users[0].email, {
        orderId: id,
        totalPrice: order.total_price,
        items: items,
        orderTime: new Date(order.created_at).toLocaleString('zh-CN')
      }).catch(err => {
        console.error('发送订单确认邮件失败:', err);
      });
    }
    
    res.json({ 
      message: '支付成功', 
      order_id: id,
      payment_time: paymentTime,
      status: '已支付'
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: '支付失败', error: err.message });
  } finally {
    conn.release();
  }
};

/**
 * 确认发货接口
 * @route POST /api/order/:id/ship
 * @param {number} id - 订单ID
 * @param {string} tracking_number - 运单号
 * @param {string} carrier - 物流公司
 * @returns {Object} 发货结果
 */
exports.ship = async (req, res) => {
  const { id } = req.params;
  const { tracking_number, carrier } = req.body;
  const emailUtil = require('../utils/email');
  
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // 查询订单
    const [orders] = await conn.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      await conn.rollback();
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const order = orders[0];
    
    // 检查订单状态
    if (order.status !== '已支付') {
      await conn.rollback();
      return res.status(400).json({ message: '订单状态不正确，无法发货' });
    }
    
    // 更新订单状态
    await conn.query(
      'UPDATE orders SET status = ?, tracking_number = ?, carrier = ?, shipped_at = NOW() WHERE id = ?',
      ['已发货', tracking_number, carrier, id]
    );
    
    // 查询用户邮箱
    const [users] = await conn.query('SELECT email FROM users WHERE id = ?', [order.user_id]);
    
    await conn.commit();
    
    // 发送发货通知邮件（异步）
    if (users.length > 0 && users[0].email) {
      emailUtil.sendShippingNotification(users[0].email, {
        orderId: id,
        trackingNumber: tracking_number,
        carrier: carrier,
        estimatedDelivery: '3-5个工作日'
      }).catch(err => {
        console.error('发送发货通知邮件失败:', err);
      });
    }
    
    res.json({ 
      message: '发货成功', 
      order_id: id,
      tracking_number,
      carrier,
      status: '已发货'
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: '发货失败', error: err.message });
  } finally {
    conn.release();
  }
};
