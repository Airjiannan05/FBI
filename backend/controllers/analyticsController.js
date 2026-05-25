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
 * 简化IP到地域
 */
function simplifyIpToRegion(ip) {
  if (!ip || ip === 'unknown') return '未知';
  // 简化处理：根据内网地址判断
  if (ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '本地';
  }
  // 实际项目中可使用 geoip-lite 等库解析
  return '远程';
}
