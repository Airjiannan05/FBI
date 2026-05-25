// ========== ECharts 图表封装模块 ========== //

// 默认主题色
const CHART_COLORS = ['#1e90ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316'];

// 通用文字样式（适配暗色主题）
const TEXT_STYLE = {
  color: '#94a3b8',
  fontSize: 12
};

/**
 * 创建销售趋势折线图
 * @param {string} domId DOM元素ID
 * @param {Array} data 数据数组 [{date, sales_amount, order_count}]
 * @param {Object} options 可选配置
 */
function createTrendChart(domId, data, options = {}) {
  const dom = document.getElementById(domId);
  if (!dom || !data || data.length === 0) return null;
  
  const chart = echarts.init(dom);
  chart.setOption({
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(30, 144, 255, 0.3)',
      textStyle: { color: '#f1f5f9' }
    },
    legend: {
      data: ['销售额', '订单数'],
      top: 0,
      textStyle: TEXT_STYLE
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date),
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } },
      axisLabel: { color: '#94a3b8', rotate: data.length > 10 ? 45 : 0 }
    },
    yAxis: [
      {
        type: 'value',
        name: '销售额 (¥)',
        nameTextStyle: TEXT_STYLE,
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
      },
      {
        type: 'value',
        name: '订单数',
        nameTextStyle: TEXT_STYLE,
        axisLabel: { color: '#94a3b8' },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '销售额',
        type: 'line',
        data: data.map(d => parseFloat(d.sales_amount || 0)),
        smooth: true,
        itemStyle: { color: CHART_COLORS[0] },
        areaStyle: { 
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(30, 144, 255, 0.02)' }
          ])
        }
      },
      {
        name: '订单数',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.order_count || 0),
        smooth: true,
        itemStyle: { color: CHART_COLORS[1] }
      }
    ],
    ...options
  });
  
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

/**
 * 创建饼图（订单状态分布）
 */
function createPieChart(domId, data, options = {}) {
  const dom = document.getElementById(domId);
  if (!dom || !data || data.length === 0) return null;
  
  const chart = echarts.init(dom);
  chart.setOption({
    tooltip: { 
      trigger: 'item',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(30, 144, 255, 0.3)',
      textStyle: { color: '#f1f5f9' },
      formatter: '{b}: {c} 单 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: TEXT_STYLE,
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: 'rgba(15, 23, 42, 0.8)',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: data.map((d, i) => ({
        value: d.count,
        name: d.status,
        itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] }
      }))
    }],
    ...options
  });
  
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

/**
 * 创建柱状图（热销商品排行）
 */
function createBarChart(domId, data, options = {}) {
  const dom = document.getElementById(domId);
  if (!dom || !data || data.length === 0) return null;
  
  const chart = echarts.init(dom);
  const names = data.map(d => d.name.length > 10 ? d.name.substring(0, 10) + '...' : d.name);
  
  chart.setOption({
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(30, 144, 255, 0.3)',
      textStyle: { color: '#f1f5f9' },
      formatter: params => {
        const d = params[0];
        return `${d.axisValue}<br/>销量: ${d.value} 件`;
      }
    },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '10px', containLabel: true },
    xAxis: {
      type: 'value',
      name: '销量 (件)',
      nameTextStyle: TEXT_STYLE,
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
    },
    yAxis: {
      type: 'category',
      data: names.reverse(),
      axisLabel: { color: '#94a3b8' },
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.3)' } }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.sold_count || d.value).reverse(),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: 'rgba(30, 144, 255, 0.3)' },
          { offset: 1, color: 'rgba(30, 144, 255, 1)' }
        ]),
        borderRadius: [0, 4, 4, 0]
      },
      label: {
        show: true,
        position: 'right',
        color: '#94a3b8',
        formatter: '{c} 件'
      }
    }],
    ...options
  });
  
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

/**
 * 创建预测趋势图（含预测虚线）
 */
function createPredictionChart(domId, historical, predictions, options = {}) {
  const dom = document.getElementById(domId);
  if (!dom) return null;
  
  const chart = echarts.init(dom);
  
  const histDates = historical.map(d => d.date);
  const histValues = historical.map(d => parseFloat(d.sales_amount));
  
  // 预测日期和值
  const lastDate = historical.length > 0 ? historical[historical.length - 1].date : '';
  const predDates = predictions.map((p, i) => `D+${i + 1}`);
  const predValues = predictions.map(p => p.predicted_sales);
  const lowerValues = predictions.map(p => p.lower_bound);
  const upperValues = predictions.map(p => p.upper_bound);
  
  chart.setOption({
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.95)',
      borderColor: 'rgba(30, 144, 255, 0.3)',
      textStyle: { color: '#f1f5f9' }
    },
    legend: {
      data: ['历史销售额', '预测销售额', '置信区间'],
      textStyle: TEXT_STYLE
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
    xAxis: {
      type: 'category',
      data: [...histDates, ...predDates],
      axisLabel: { color: '#94a3b8', rotate: histDates.length > 10 ? 45 : 0 }
    },
    yAxis: {
      type: 'value',
      name: '销售额 (¥)',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
    },
    series: [
      {
        name: '历史销售额',
        type: 'line',
        data: [...histValues, ...Array(predDates.length).fill(null)],
        smooth: true,
        itemStyle: { color: CHART_COLORS[0] }
      },
      {
        name: '预测销售额',
        type: 'line',
        data: [...Array(histDates.length).fill(null), ...predValues],
        smooth: true,
        lineStyle: { type: 'dashed', color: CHART_COLORS[2] },
        itemStyle: { color: CHART_COLORS[2] }
      },
      {
        name: '置信区间',
        type: 'line',
        data: [...Array(histDates.length).fill(null), ...upperValues],
        smooth: true,
        lineStyle: { type: 'dotted', color: 'rgba(245, 158, 11, 0.5)', width: 1 },
        itemStyle: { color: 'rgba(245, 158, 11, 0.5)' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.05)' }
      },
      {
        name: '置信区间下',
        type: 'line',
        data: [...Array(histDates.length).fill(null), ...lowerValues],
        smooth: true,
        lineStyle: { type: 'dotted', color: 'rgba(245, 158, 11, 0.3)', width: 1 },
        itemStyle: { color: 'rgba(245, 158, 11, 0.3)' },
        areaStyle: { color: 'rgba(245, 158, 11, 0.05)' }
      }
    ],
    ...options
  });
  
  window.addEventListener('resize', () => chart.resize());
  return chart;
}

// 导出
window.charts = {
  createTrendChart,
  createPieChart,
  createBarChart,
  createPredictionChart,
  CHART_COLORS
};
