/**
 * 销售异常检测服务
 * 使用 Z-score 统计阈值法
 */
const pool = require('../config/db');

/**
 * Z-score 异常检测
 * |Z-score| > 2 → 警告
 * |Z-score| > 3 → 严重异常
 * 
 * @param {Array} stats 统计数据集
 * @returns {Array} 异常列表
 */
function detectAnomalies(stats) {
  if (!stats || stats.length < 7) return [];
  
  const values = stats.map(s => parseFloat(s.sales_amount));
  
  // 计算均值和标准差
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return []; // 所有值相同，无异常
  
  // 检测
  const anomalies = [];
  for (let i = 0; i < n; i++) {
    const zScore = (values[i] - mean) / stdDev;
    const absZ = Math.abs(zScore);
    
    if (absZ > 2) {
      anomalies.push({
        date: stats[i].date,
        sales_amount: values[i],
        z_score: parseFloat(zScore.toFixed(3)),
        severity: absZ > 3 ? '严重异常' : '警告',
        direction: zScore > 0 ? '偏高' : '偏低',
        order_count: stats[i].order_count || 0
      });
    }
  }
  
  return anomalies.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score));
}

/**
 * 获取销售异常
 * @param {number} sellerId 卖家ID（可选）
 * @param {number} days 检测天数
 * @returns {Object} 异常结果
 */
async function getSalesAnomalies(sellerId = null, days = 30) {
  let sql, params;
  
  if (sellerId) {
    sql = `
      SELECT DATE_FORMAT(o.created_at, '%Y-%m-%d') as date,
             COALESCE(SUM(oi.quantity * oi.price), 0) as sales_amount,
             COUNT(DISTINCT o.id) as order_count
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.seller_id = ? 
      AND o.status IN ('已支付', '已发货', '已完成')
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(o.created_at, '%Y-%m-%d')
      ORDER BY date ASC`;
    params = [sellerId, days];
  } else {
    sql = `
      SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date,
             COALESCE(SUM(total_price), 0) as sales_amount,
             COUNT(*) as order_count
      FROM orders
      WHERE status IN ('已支付', '已发货', '已完成')
      AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date ASC`;
    params = [days];
  }
  
  const [stats] = await pool.query(sql, params);
  
  // 计算统计信息
  const values = stats.map(s => parseFloat(s.sales_amount));
  const n = values.length;
  const mean = n > 0 ? values.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n > 0 ? values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n : 0;
  const stdDev = Math.sqrt(variance);
  
  const anomalies = detectAnomalies(stats);
  
  return {
    summary: {
      period_days: days,
      daily_mean: parseFloat(mean.toFixed(2)),
      daily_stddev: parseFloat(stdDev.toFixed(2)),
      upper_threshold: parseFloat((mean + 2 * stdDev).toFixed(2)),
      lower_threshold: parseFloat(Math.max(0, mean - 2 * stdDev).toFixed(2)),
      anomaly_count: anomalies.length
    },
    anomalies
  };
}

module.exports = {
  getSalesAnomalies,
  detectAnomalies
};
