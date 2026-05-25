/**
 * 销售趋势预测服务
 * 使用移动平均法 + 简单线性回归
 */
const pool = require('../config/db');

/**
 * 移动平均预测
 * @param {Array} data 时间序列数据 [{date, sales_amount}]
 * @param {number} windowSize 窗口大小（天数）
 * @returns {Array} 包含预测值的序列
 */
function movingAveragePrediction(data, windowSize = 7) {
  if (!data || data.length < windowSize) return [];
  
  const result = [];
  for (let i = windowSize - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - windowSize + 1; j <= i; j++) {
      sum += parseFloat(data[j].sales_amount);
    }
    const avg = sum / windowSize;
    // 预测下一天 = 最近 windowSize 天的平均值
    const predicted = i + 1 < data.length ? 
      parseFloat(data[i + 1].sales_amount) : 
      parseFloat((avg * 1.0).toFixed(2));
    
    result.push({
      date: data[i].date,
      actual: parseFloat(data[i].sales_amount),
      predicted: parseFloat(avg.toFixed(2)),
      next_day_prediction: predicted
    });
  }
  return result;
}

/**
 * 简单线性回归预测
 * @param {Array} data 时间序列数据
 * @param {number} daysAhead 预测未来天数
 * @returns {Object} 预测结果
 */
function linearRegressionPrediction(data, daysAhead = 7) {
  if (!data || data.length < 3) {
    return { predictions: [], confidence: 0, message: '数据不足，至少需要3个数据点' };
  }
  
  const n = data.length;
  const sales = data.map((d, i) => ({ x: i, y: parseFloat(d.sales_amount) }));
  
  // 计算回归参数 y = a + bx
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const point of sales) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumX2 += point.x * point.x;
  }
  
  const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const a = (sumY - b * sumX) / n;
  
  // 计算 R²
  const meanY = sumY / n;
  let ssRes = 0, ssTot = 0;
  for (const point of sales) {
    const predicted = a + b * point.x;
    ssRes += Math.pow(point.y - predicted, 2);
    ssTot += Math.pow(point.y - meanY, 2);
  }
  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  
  // 预测未来
  const predictions = [];
  for (let i = 0; i < daysAhead; i++) {
    const pred = a + b * (n + i);
    predictions.push({
      day: i + 1,
      predicted_sales: Math.max(0, parseFloat(pred.toFixed(2))),
      lower_bound: Math.max(0, parseFloat((pred * 0.7).toFixed(2))),
      upper_bound: parseFloat((pred * 1.3).toFixed(2))
    });
  }
  
  const trend = b > 0 ? '上升' : (b < 0 ? '下降' : '平稳');
  
  return {
    predictions,
    trend_direction: trend,
    slope: parseFloat(b.toFixed(4)),
    intercept: parseFloat(a.toFixed(2)),
    r_squared: parseFloat(rSquared.toFixed(4)),
    confidence: rSquared > 0.7 ? '高' : (rSquared > 0.4 ? '中' : '低')
  };
}

/**
 * 获取销售数据并预测
 * @param {number} sellerId 卖家ID（可选，null为全局）
 * @param {number} days 历史天数
 * @returns {Object} 包含历史和预测
 */
async function getSalesPrediction(sellerId = null, days = 30) {
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
  
  const [data] = await pool.query(sql, params);
  
  const movingAvg = movingAveragePrediction(data);
  const linearReg = linearRegressionPrediction(data);
  
  return {
    historical: data,
    moving_average: movingAvg.slice(-7),
    linear_regression: linearReg
  };
}

module.exports = {
  getSalesPrediction,
  movingAveragePrediction,
  linearRegressionPrediction
};
