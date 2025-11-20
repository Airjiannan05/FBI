const pool = require('../config/db');

/**
 * 获取商家的销售订单列表
 * @route GET /api/sales/orders
 * @query {number} seller_id - 商家用户ID
 * @query {string} status - 可选，订单状态筛选
 * @query {string} start_date - 可选，开始日期
 * @query {string} end_date - 可选，结束日期
 * @returns {Array} orders 订单列表
 */
exports.getSellerOrders = async (req, res) => {
  const { seller_id, status, start_date, end_date } = req.query;
  
  if (!seller_id) {
    return res.status(400).json({ message: '缺少商家ID' });
  }
  
  try {
    let sql = `
      SELECT DISTINCT 
        o.id,
        o.user_id,
        o.total_price,
        o.status,
        o.payment_method,
        o.payment_time,
        o.shipping_address,
        o.tracking_number,
        o.carrier,
        o.shipped_at,
        o.created_at,
        u.username as buyer_name,
        u.email as buyer_email
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN products p ON oi.product_id = p.id
      LEFT JOIN users u ON o.user_id = u.id
      WHERE p.user_id = ?
    `;
    let params = [seller_id];
    
    // 状态筛选
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    
    // 日期范围筛选
    if (start_date) {
      sql += ' AND o.created_at >= ?';
      params.push(start_date);
    }
    if (end_date) {
      sql += ' AND o.created_at <= ?';
      params.push(end_date + ' 23:59:59');
    }
    
    sql += ' ORDER BY o.created_at DESC';
    
    const [orders] = await pool.query(sql, params);
    
    // 为每个订单获取商品明细
    for (let order of orders) {
      const [items] = await pool.query(
        `SELECT oi.*, p.name, p.image_url 
         FROM order_items oi 
         JOIN products p ON oi.product_id = p.id 
         WHERE oi.order_id = ? AND p.user_id = ?`,
        [order.id, seller_id]
      );
      order.items = items;
    }
    
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: '查询订单失败', error: err.message });
  }
};

/**
 * 获取销售统计数据
 * @route GET /api/sales/statistics
 * @query {number} seller_id - 商家用户ID
 * @query {string} period - 统计周期: day/week/month/year
 * @returns {Object} 统计数据
 */
exports.getSalesStatistics = async (req, res) => {
  const { seller_id, period = 'month' } = req.query;
  
  if (!seller_id) {
    return res.status(400).json({ message: '缺少商家ID' });
  }
  
  try {
    // 1. 总销售额和订单数
    const [totalStats] = await pool.query(
      `SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_sales,
        COUNT(DISTINCT oi.product_id) as total_products_sold,
        COALESCE(SUM(oi.quantity), 0) as total_items_sold
       FROM orders o
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE p.user_id = ? AND o.status IN ('已支付', '已发货', '已完成')`,
      [seller_id]
    );
    
    // 2. 各状态订单数
    const [statusStats] = await pool.query(
      `SELECT 
        o.status,
        COUNT(DISTINCT o.id) as count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as amount
       FROM orders o
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE p.user_id = ?
       GROUP BY o.status`,
      [seller_id]
    );
    
    // 3. 按时间统计销售趋势
    let dateFormat = '';
    let dateInterval = '';
    
    switch(period) {
      case 'day':
        dateFormat = '%Y-%m-%d %H:00';
        dateInterval = 'INTERVAL 24 HOUR';
        break;
      case 'week':
        dateFormat = '%Y-%m-%d';
        dateInterval = 'INTERVAL 7 DAY';
        break;
      case 'month':
        dateFormat = '%Y-%m-%d';
        dateInterval = 'INTERVAL 30 DAY';
        break;
      case 'year':
        dateFormat = '%Y-%m';
        dateInterval = 'INTERVAL 12 MONTH';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateInterval = 'INTERVAL 30 DAY';
    }
    
    const [trendData] = await pool.query(
      `SELECT 
        DATE_FORMAT(o.created_at, '${dateFormat}') as date,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as sales_amount,
        COALESCE(SUM(oi.quantity), 0) as items_sold
       FROM orders o
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE p.user_id = ? 
       AND o.status IN ('已支付', '已发货', '已完成')
       AND o.created_at >= DATE_SUB(NOW(), ${dateInterval})
       GROUP BY DATE_FORMAT(o.created_at, '${dateFormat}')
       ORDER BY date ASC`,
      [seller_id]
    );
    
    // 4. 热销商品Top 10
    const [topProducts] = await pool.query(
      `SELECT 
        p.id,
        p.name,
        p.image_url,
        p.price,
        COALESCE(SUM(oi.quantity), 0) as sold_count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as sales_amount
       FROM products p
       INNER JOIN order_items oi ON p.id = oi.product_id
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE p.user_id = ? AND o.status IN ('已支付', '已发货', '已完成')
       GROUP BY p.id, p.name, p.image_url, p.price
       ORDER BY sold_count DESC
       LIMIT 10`,
      [seller_id]
    );
    
    // 5. 最近7天的每日统计
    const [recentDaily] = await pool.query(
      `SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m-%d') as date,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as sales_amount
       FROM orders o
       INNER JOIN order_items oi ON o.id = oi.order_id
       INNER JOIN products p ON oi.product_id = p.id
       WHERE p.user_id = ? 
       AND o.status IN ('已支付', '已发货', '已完成')
       AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
       ORDER BY date ASC`,
      [seller_id]
    );
    
    res.json({
      summary: totalStats[0],
      statusBreakdown: statusStats,
      trend: trendData,
      topProducts: topProducts,
      recentDaily: recentDaily
    });
  } catch (err) {
    res.status(500).json({ message: '获取统计数据失败', error: err.message });
  }
};

/**
 * 获取商品销售详情
 * @route GET /api/sales/product/:productId
 * @param {number} productId - 商品ID
 * @returns {Object} 商品销售详情
 */
exports.getProductSalesDetail = async (req, res) => {
  const { productId } = req.params;
  const { seller_id } = req.query;
  
  if (!seller_id) {
    return res.status(400).json({ message: '缺少商家ID' });
  }
  
  try {
    // 验证商品所有权
    const [products] = await pool.query(
      'SELECT * FROM products WHERE id = ? AND user_id = ?',
      [productId, seller_id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: '商品不存在或无权限' });
    }
    
    const product = products[0];
    
    // 销售统计
    const [salesStats] = await pool.query(
      `SELECT 
        COALESCE(SUM(oi.quantity), 0) as total_sold,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total_revenue,
        COUNT(DISTINCT o.id) as order_count,
        AVG(oi.price) as avg_price
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.status IN ('已支付', '已发货', '已完成')`,
      [productId]
    );
    
    // 每日销售趋势
    const [dailyTrend] = await pool.query(
      `SELECT 
        DATE_FORMAT(o.created_at, '%Y-%m-%d') as date,
        SUM(oi.quantity) as sold_count,
        SUM(oi.quantity * oi.price) as sales_amount
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND o.status IN ('已支付', '已发货', '已完成')
       AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
       ORDER BY date ASC`,
      [productId]
    );
    
    res.json({
      product: product,
      statistics: salesStats[0],
      dailyTrend: dailyTrend
    });
  } catch (err) {
    res.status(500).json({ message: '获取商品销售详情失败', error: err.message });
  }
};

module.exports = exports;
