const pool = require('../config/db');

/**
 * 简单推荐："浏览过此商品的人也买了..."
 * @route GET /api/recommend/also-bought
 * @query {number} product_id 当前商品ID
 * @query {number} limit 推荐数量（默认5）
 */
exports.alsoBought = async (req, res) => {
  const { product_id, limit = 5 } = req.query;
  if (!product_id) {
    return res.status(400).json({ message: '缺少商品ID' });
  }
  try {
    // 1. 查找浏览过该商品的所有用户
    // 2. 查找这些用户购买的其它商品（排除当前商品）
    // 3. 按购买次数排序
    const [recommendations] = await pool.query(
      `SELECT p.id, p.name, p.price, p.image_url, COUNT(oi.id) as bought_count
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       WHERE o.user_id IN (
         SELECT DISTINCT bh.user_id FROM browse_history bh WHERE bh.product_id = ?
       )
       AND oi.product_id != ?
       AND o.status IN ('已支付', '已发货', '已完成')
       GROUP BY p.id, p.name, p.price, p.image_url
       ORDER BY bought_count DESC
       LIMIT ?`,
      [product_id, product_id, parseInt(limit)]
    );

    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: '获取推荐失败', error: err.message });
  }
};

/**
 * 个性化协同过滤推荐
 * @route GET /api/recommend/personal
 * @query {number} user_id 用户ID
 * @query {number} limit 推荐数量（默认10）
 */
exports.personalRecommend = async (req, res) => {
  const { user_id, limit = 10 } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: '缺少用户ID' });
  }
  try {
    const recommendations = await collaborativeFilter(user_id, parseInt(limit));
    res.json({ recommendations });
  } catch (err) {
    res.status(500).json({ message: '获取推荐失败', error: err.message });
  }
};

/**
 * 基于用户的协同过滤算法
 * @param {number} targetUserId 目标用户ID
 * @param {number} limit 推荐数量
 * @returns {Array} 推荐商品列表
 */
async function collaborativeFilter(targetUserId, limit = 10) {
  // 1. 构建用户-商品购买矩阵（简化：按购买次数作为权重）
  const [allPurchases] = await pool.query(
    `SELECT o.user_id, oi.product_id, COUNT(*) as purchase_count
     FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE o.status IN ('已支付', '已发货', '已完成')
     GROUP BY o.user_id, oi.product_id`
  );

  if (allPurchases.length === 0) return [];

  // 构建矩阵
  const userProducts = {}; // { userId: { productId: count } }
  const allProducts = new Set();
  const allUsers = new Set();

  for (const row of allPurchases) {
    if (!userProducts[row.user_id]) userProducts[row.user_id] = {};
    userProducts[row.user_id][row.product_id] = row.purchase_count;
    allProducts.add(row.product_id);
    allUsers.add(row.user_id);
  }

  // 如果目标用户没有购买记录，返回热门商品
  const targetPurchases = userProducts[targetUserId] || {};
  if (Object.keys(targetPurchases).length === 0) {
    return await getPopularProducts(limit);
  }

  // 2. 计算目标用户与其他用户的余弦相似度
  const similarities = [];
  for (const otherId of allUsers) {
    if (otherId == targetUserId) continue;

    const otherPurchases = userProducts[otherId] || {};
    const similarity = cosineSimilarity(targetPurchases, otherPurchases);
    if (similarity > 0) {
      similarities.push({ userId: otherId, similarity });
    }
  }

  // 3. 取 Top K 个最相似用户 (K=20)
  similarities.sort((a, b) => b.similarity - a.similarity);
  const topK = 20;
  const neighbors = similarities.slice(0, topK);

  // 4. 聚合推荐
  const scores = {}; // { productId: weightedScore }
  const totalSim = neighbors.reduce((sum, n) => sum + n.similarity, 0);

  for (const neighbor of neighbors) {
    const neighborPurchases = userProducts[neighbor.userId] || {};
    const weight = neighbor.similarity / (totalSim || 1);

    for (const [productId, count] of Object.entries(neighborPurchases)) {
      const pid = parseInt(productId);
      if (targetPurchases[pid]) continue; // 跳过已购买的

      if (!scores[pid]) scores[pid] = 0;
      scores[pid] += count * weight;
    }
  }

  // 5. 排序并取 Top N
  const sorted = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, score]) => ({ product_id: parseInt(productId), score }));

  if (sorted.length === 0) {
    return await getPopularProducts(limit);
  }

  // 6. 补充商品详细信息
  const productIds = sorted.map(s => s.product_id);
  if (productIds.length > 0) {
    const [products] = await pool.query(
      'SELECT id, name, price, image_url, stock FROM products WHERE id IN (?)',
      [productIds]
    );

    const productMap = {};
    for (const p of products) {
      productMap[p.id] = p;
    }

    return sorted
      .filter(s => productMap[s.product_id])
      .map(s => ({
        ...productMap[s.product_id],
        id: s.product_id,
        score: parseFloat(s.score.toFixed(4))
      }));
  }

  return await getPopularProducts(limit);
}

/**
 * 余弦相似度计算
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  // 基于共同维度计算
  const allKeys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);

  for (const key of allKeys) {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dotProduct += a * b;
  }

  // 分别计算范数
  for (const val of Object.values(vecA)) normA += val * val;
  for (const val of Object.values(vecB)) normB += val * val;

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 获取热门商品（冷启动降级方案）
 */
async function getPopularProducts(limit = 10) {
  const [products] = await pool.query(
    `SELECT p.id, p.name, p.price, p.image_url, p.stock,
            COALESCE(SUM(oi.quantity), 0) as sold_count
     FROM products p
     LEFT JOIN order_items oi ON p.id = oi.product_id
     LEFT JOIN orders o ON oi.order_id = o.id AND o.status IN ('已支付', '已发货', '已完成')
     GROUP BY p.id
     ORDER BY sold_count DESC
     LIMIT ?`,
    [limit]
  );
  return products;
}
