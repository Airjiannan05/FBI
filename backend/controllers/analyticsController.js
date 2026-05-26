const pool = require('../config/db');

/**
 * 记录浏览开始（返回记录ID用于后续更新）
 * @route POST /api/analytics/start-browse
 */
exports.startBrowse = async (req, res) => {
  const { product_id, category_id } = req.body;
  if (!product_id) {
    return res.status(400).json({ message: '缺少商品ID' });
  }
  try {
    const userId = req.user ? req.user.id : null;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    const [result] = await pool.query(
      'INSERT INTO browse_history (user_id, product_id, category_id, start_time, ip_address, user_agent) VALUES (?, ?, ?, NOW(), ?, ?)',
      [userId, product_id, category_id || null, ip, userAgent]
    );
    res.json({ message: '浏览开始', browse_id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '记录失败', error: err.message });
  }
};

/**
 * 结束浏览（更新停留时长）
 * @route PUT /api/analytics/end-browse/:id
 */
exports.endBrowse = async (req, res) => {
  const { id } = req.params;
  try {
    // 计算停留时长
    const [result] = await pool.query(
      'UPDATE browse_history SET duration_seconds = TIMESTAMPDIFF(SECOND, start_time, NOW()) WHERE id = ? AND duration_seconds = 0',
      [id]
    );
    res.json({ message: '浏览结束', updated: result.affectedRows > 0 });
  } catch (err) {
    res.status(500).json({ message: '更新失败', error: err.message });
  }
};

/**
 * 记录浏览行为（一次性记录）
 * @route POST /api/analytics/browse
 */
exports.recordBrowse = async (req, res) => {
  const { product_id, category_id, duration_seconds } = req.body;
  if (!product_id) {
    return res.status(400).json({ message: '缺少商品ID' });
  }
  try {
    const userId = req.user ? req.user.id : null;
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || '';

    await pool.query(
      'INSERT INTO browse_history (user_id, product_id, category_id, start_time, duration_seconds, ip_address, user_agent) VALUES (?, ?, ?, NOW(), ?, ?, ?)',
      [userId, product_id, category_id || null, duration_seconds || 0, ip, userAgent]
    );
    res.json({ message: '浏览记录已保存' });
  } catch (err) {
    res.status(500).json({ message: '记录失败', error: err.message });
  }
};

/**
 * 获取用户画像
 * @route GET /api/analytics/profile/:userId
 */
exports.getUserProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const [profiles] = await pool.query(
      'SELECT * FROM user_profile WHERE user_id = ?',
      [userId]
    );

    if (profiles.length === 0) {
      // 尝试即时生成
      await generateUserProfile(userId);
      const [newProfile] = await pool.query(
        'SELECT * FROM user_profile WHERE user_id = ?',
        [userId]
      );
      if (newProfile.length === 0) {
        return res.status(404).json({ message: '暂无画像数据' });
      }
      return res.json({ profile: newProfile[0] });
    }

    res.json({ profile: profiles[0] });
  } catch (err) {
    res.status(500).json({ message: '获取用户画像失败', error: err.message });
  }
};

/**
 * 刷新用户画像
 * @route POST /api/analytics/refresh-profile/:userId
 */
exports.refreshProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    await generateUserProfile(userId);
    const [profiles] = await pool.query('SELECT * FROM user_profile WHERE user_id = ?', [userId]);
    res.json({ message: '画像已刷新', profile: profiles[0] });
  } catch (err) {
    res.status(500).json({ message: '刷新画像失败', error: err.message });
  }
};

/**
 * 生成用户画像
 */
async function generateUserProfile(userId) {
  // 1. 统计购买数据
  const [orderStats] = await pool.query(
    `SELECT 
       COALESCE(SUM(o.total_price), 0) as total_spent,
       COUNT(DISTINCT o.id) as order_count,
       COALESCE(AVG(o.total_price), 0) as avg_order_value
     FROM orders o
     WHERE o.user_id = ? AND o.status IN ('已支付', '已发货', '已完成')`,
    [userId]
  );
  const stats = orderStats[0];

  // 2. 购买力评估
  let purchasingPower = 'low';
  if (stats.total_spent > 2000) purchasingPower = 'high';
  else if (stats.total_spent > 500) purchasingPower = 'medium';

  // 3. 偏好分类统计（来自订单）
  const [orderPrefs] = await pool.query(
    `SELECT c.id, c.name, COUNT(*) as cnt
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     JOIN products p ON oi.product_id = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE o.user_id = ? AND o.status IN ('已支付', '已发货', '已完成') AND c.id IS NOT NULL
     GROUP BY c.id, c.name
     ORDER BY cnt DESC LIMIT 3`,
    [userId]
  );

  // 4. 浏览偏好统计
  const [browsePrefs] = await pool.query(
    `SELECT c.id, c.name, COUNT(*) as cnt
     FROM browse_history bh
     LEFT JOIN categories c ON bh.category_id = c.id
     WHERE bh.user_id = ? AND c.id IS NOT NULL
     GROUP BY c.id, c.name
     ORDER BY cnt DESC LIMIT 5`,
    [userId]
  );

  // 5. 地域分析（简化：取最近IP）
  const [lastLogin] = await pool.query(
    'SELECT ip_address FROM user_logs WHERE user_id = ? ORDER BY login_time DESC LIMIT 1',
    [userId]
  );
  const region = lastLogin.length > 0 ? simplifyIpToRegion(lastLogin[0].ip_address) : '未知';

  // 6. 浏览总数
  const [browseCount] = await pool.query(
    'SELECT COUNT(*) as cnt FROM browse_history WHERE user_id = ?',
    [userId]
  );

  const favoriteCategories = JSON.stringify(orderPrefs.length > 0 ? orderPrefs : browsePrefs);

  await pool.query(
    `INSERT INTO user_profile (user_id, region, purchasing_power, preference_category, total_spent, order_count, avg_order_value, favorite_categories, browse_count, last_login_ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       region = VALUES(region),
       purchasing_power = VALUES(purchasing_power),
       preference_category = VALUES(preference_category),
       total_spent = VALUES(total_spent),
       order_count = VALUES(order_count),
       avg_order_value = VALUES(avg_order_value),
       favorite_categories = VALUES(favorite_categories),
       browse_count = VALUES(browse_count),
       last_login_ip = VALUES(last_login_ip)`,
    [
      userId, region, purchasingPower,
      orderPrefs.map(p => p.name).join('、') || browsePrefs.map(p => p.name).join('、') || '暂无',
      stats.total_spent, stats.order_count, stats.avg_order_value,
      favoriteCategories,
      browseCount[0].cnt,
      lastLogin.length > 0 ? lastLogin[0].ip_address : null
    ]
  );
}

/**
 * 获取浏览日志（销售人员可查所有用户浏览记录）
 * @route GET /api/analytics/browse-logs?page=1&limit=20&userId=&productId=
 */
exports.getBrowseLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const { userId, productId, sellerId } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    if (userId) { where += ' AND bh.user_id = ?'; params.push(userId); }
    if (productId) { where += ' AND bh.product_id = ?'; params.push(productId); }
    if (sellerId) { where += ' AND p.user_id = ?'; params.push(sellerId); }

    const joins = `LEFT JOIN users u ON bh.user_id = u.id
       LEFT JOIN products p ON bh.product_id = p.id
       LEFT JOIN categories c ON bh.category_id = c.id`;

    const [rows] = await pool.query(
      `SELECT bh.id, bh.user_id, u.username, bh.product_id, p.name AS product_name,
              bh.category_id, c.name AS category_name, bh.start_time, bh.duration_seconds, bh.ip_address
       FROM browse_history bh
       ${joins}
       ${where}
       ORDER BY bh.start_time DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM browse_history bh ${joins} ${where}`, params
    );

    res.json({ logs: rows, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: '查询失败', error: err.message });
  }
};

/**
 * 获取购买日志（订单记录，销售人员可查）
 * @route GET /api/analytics/purchase-logs?page=1&limit=20&userId=&status=
 */
exports.getPurchaseLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const { userId, status, sellerId } = req.query;

    let where = 'WHERE 1=1';
    const params = [];
    if (userId) { where += ' AND o.user_id = ?'; params.push(userId); }
    if (status) { where += ' AND o.status = ?'; params.push(status); }
    if (sellerId) { where += ' AND oi.seller_id = ?'; params.push(sellerId); }

    const [rows] = await pool.query(
      `SELECT o.id, o.user_id, u.username AS buyer_name, o.total_price, o.status,
              o.payment_method, o.payment_time, o.tracking_number, o.carrier, o.shipped_at, o.created_at
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       ${sellerId ? 'JOIN order_items oi ON o.id = oi.order_id' : ''}
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(DISTINCT o.id) AS total FROM orders o
       ${sellerId ? 'JOIN order_items oi ON o.id = oi.order_id' : ''}
       ${where}`, params
    );

    // 为每个订单加载商品明细
    for (const row of rows) {
      const itemParams = [row.id];
      let itemWhere = 'WHERE oi.order_id = ?';
      if (sellerId) {
        itemWhere += ' AND oi.seller_id = ?';
        itemParams.push(sellerId);
      }
      const [items] = await pool.query(
        `SELECT oi.*, p.name AS product_name, p.image_url
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         ${itemWhere}`,
        itemParams
      );
      row.items = items;
    }

    res.json({ logs: rows, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: '查询失败', error: err.message });
  }
};

/**
 * 获取用户列表（供销售人员查看）
 * @route GET /api/analytics/users?search=
 */
exports.getUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let where = '';
    const params = [];
    if (search) { where = 'WHERE username LIKE ? OR email LIKE ?'; params.push(`%${search}%`, `%${search}%`); }

    const [rows] = await pool.query(
      `SELECT id, username, email, role, created_at FROM users ${where} ORDER BY created_at DESC LIMIT 50`,
      params
    );
    res.json({ users: rows });
  } catch (err) {
    res.status(500).json({ message: '查询失败', error: err.message });
  }
};

/**
 * 简化IP到地域
 */
function simplifyIpToRegion(ip) {
  if (!ip || ip === 'unknown') return '未知';
  if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '本地';
  }
  return '远程';
}
