// ========== 销售统计模块（ECharts版 + 预测 + 异常） ========== //

// 显示销售统计页面
async function showSalesStatistics() {
  console.log('📊 调用 showSalesStatistics() - 显示销售统计页面');
  const main = document.getElementById('main-content');

  const user = window.auth.getCurrentUser();
  if (!user) {
    window.utils.showToast('请先登录');
    return;
  }

  main.innerHTML = `
    <div class="container">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 10px;" class="gradient-text">📊 销售统计</h2>
        <p style="color: var(--color-text-muted); font-size: 1rem;">查看销售数据、趋势预测和异常检测</p>
      </div>

      <div class="sales-tabs">
        <button class="sales-tab active" data-tab="overview">数据概览</button>
        <button class="sales-tab" data-tab="orders">订单管理</button>
        <button class="sales-tab" data-tab="prediction">趋势预测</button>
        <button class="sales-tab" data-tab="anomalies">异常检测</button>
        <button class="sales-tab" data-tab="products">商品销售</button>
      </div>

      <div id="sales-content" style="margin-top: 30px;">
        <div class="loading-spinner">加载中...</div>
      </div>
    </div>
  `;

  document.querySelectorAll('.sales-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.sales-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabName = tab.dataset.tab;
      switch (tabName) {
        case 'overview': loadOverviewTab(); break;
        case 'orders': loadOrdersTab(); break;
        case 'prediction': loadPredictionTab(); break;
        case 'anomalies': loadAnomaliesTab(); break;
        case 'products': loadProductsTab(); break;
      }
    };
  });

  await loadOverviewTab();
}

// 加载数据概览标签（ECharts版）
async function loadOverviewTab() {
  const content = document.getElementById('sales-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const stats = await window.api.fetchSalesStatistics('month');

    content.innerHTML = `
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-label">总销售额</div>
            <div class="stat-value">￥${parseFloat(stats.summary.total_sales || 0).toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-label">总订单数</div>
            <div class="stat-value">${stats.summary.total_orders || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛍️</div>
          <div class="stat-info">
            <div class="stat-label">商品销量</div>
            <div class="stat-value">${stats.summary.total_items_sold || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-info">
            <div class="stat-label">在售商品</div>
            <div class="stat-value">${stats.summary.total_products_sold || 0}</div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3 class="section-title">销售趋势（最近30天）</h3>
        <div id="chart-trend" style="width:100%;height:350px;"></div>
      </div>

      <div class="stats-section">
        <h3 class="section-title">订单状态分布</h3>
        <div id="chart-status" style="width:100%;height:300px;"></div>
      </div>

      <div class="stats-section">
        <h3 class="section-title">🔥 热销商品 Top 10</h3>
        <div id="chart-top" style="width:100%;height:400px;"></div>
      </div>
    `;

    // 渲染 ECharts 图表（延迟确保 DOM 就绪）
    setTimeout(() => {
      if (stats.trend && stats.trend.length > 0) {
        window.charts.createTrendChart('chart-trend', stats.trend);
      }
      if (stats.statusBreakdown && stats.statusBreakdown.length > 0) {
        window.charts.createPieChart('chart-status', stats.statusBreakdown);
      }
      if (stats.topProducts && stats.topProducts.length > 0) {
        window.charts.createBarChart('chart-top', stats.topProducts.map(p => ({
          name: p.name,
          sold_count: parseInt(p.sold_count),
          value: parseFloat(p.sales_amount)
        })));
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
  }
}

// 加载订单管理标签
async function loadOrdersTab(filterStatus = '', filterStartDate = '', filterEndDate = '') {
  const content = document.getElementById('sales-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const orders = await window.api.fetchSellerOrders(filterStatus, filterStartDate, filterEndDate);

    content.innerHTML = `
      <div class="order-filters">
        <select id="status-filter" class="filter-select">
          <option value="" ${!filterStatus ? 'selected' : ''}>全部状态</option>
          <option value="待支付" ${filterStatus === '待支付' ? 'selected' : ''}>待支付</option>
          <option value="已支付" ${filterStatus === '已支付' ? 'selected' : ''}>已支付</option>
          <option value="已发货" ${filterStatus === '已发货' ? 'selected' : ''}>已发货</option>
          <option value="已完成" ${filterStatus === '已完成' ? 'selected' : ''}>已完成</option>
        </select>
        <input type="date" id="start-date" class="filter-input" value="${filterStartDate}">
        <input type="date" id="end-date" class="filter-input" value="${filterEndDate}">
        <button id="apply-filter" class="neon-btn btn-small">筛选</button>
        <button id="reset-filter" class="neon-btn btn-small" style="background: rgba(148, 163, 184, 0.2);">重置</button>
      </div>

      <div class="orders-list">
        ${orders.length === 0 ? '<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">暂无订单</div>' :
          orders.map(o => `
            <div class="order-card">
              <div class="order-header">
                <div class="order-info-row">
                  <span class="order-id">订单号: #${o.id}</span>
                  <span class="order-time">${new Date(o.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div class="order-info-row">
                  <span class="buyer-info">买家: ${o.buyer_name || '未知'} (${o.buyer_email || ''})</span>
                  <span class="order-status status-${o.status}">${o.status}</span>
                </div>
              </div>
              <div class="order-items">
                ${o.items.map(item => `
                  <div class="order-item-row">
                    <img src="${item.image_url || 'https://via.placeholder.com/50'}" alt="${item.name}" class="item-thumb">
                    <div class="item-details">
                      <div class="item-name">${item.name}</div>
                      <div class="item-price">￥${item.price} × ${item.quantity}</div>
                    </div>
                    <div class="item-total">￥${(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                `).join('')}
              </div>
              <div class="order-footer">
                <div class="order-total">总计: <span style="color: var(--color-primary); font-size: 1.2rem; font-weight: 600;">￥${o.total_price}</span></div>
                <div class="order-actions">
                  ${o.status === '已支付' ? `<button class="btn-ship neon-btn btn-small" data-id="${o.id}">安排发货</button>` : ''}
                  ${o.tracking_number ? `<span class="tracking-info">快递: ${o.carrier || ''} ${o.tracking_number}</span>` : ''}
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    document.getElementById('apply-filter')?.addEventListener('click', async () => {
      await loadOrdersTab(
        document.getElementById('status-filter').value,
        document.getElementById('start-date').value,
        document.getElementById('end-date').value
      );
    });

    document.getElementById('reset-filter')?.addEventListener('click', () => loadOrdersTab());

    document.querySelectorAll('.btn-ship').forEach(btn => {
      btn.onclick = async () => {
        const orderId = btn.dataset.id;
        const trackingNumber = prompt('请输入快递单号:');
        if (!trackingNumber || !trackingNumber.trim()) return;
        const carrier = prompt('请输入快递公司:', '顺丰速运');
        if (!carrier || !carrier.trim()) return;

        btn.disabled = true;
        btn.textContent = '发货中...';
        try {
          const res = await window.api.shipOrder(orderId, trackingNumber.trim(), carrier.trim());
          if (res.message && res.message.includes('成功')) {
            window.utils.showToast('✓ 发货成功！');
            loadOrdersTab();
          } else {
            window.utils.showToast('✗ ' + (res.message || '发货失败'));
            btn.disabled = false;
            btn.textContent = '安排发货';
          }
        } catch (err) {
          window.utils.showToast('✗ 发货失败');
          btn.disabled = false;
          btn.textContent = '安排发货';
        }
      };
    });

  } catch (err) {
    content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
  }
}

// 加载趋势预测标签
async function loadPredictionTab() {
  const content = document.getElementById('sales-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const user = window.auth.getCurrentUser();
    const prediction = await window.api.fetchSalesPrediction(user.id, 30);

    content.innerHTML = `
      <div class="stats-section">
        <h3 class="section-title">📈 销售趋势预测</h3>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 15px;">
          基于最近30天销售数据的线性回归预测 |
          趋势方向: <span style="color: ${prediction.linear_regression?.trend_direction === '上升' ? '#10b981' : (prediction.linear_regression?.trend_direction === '下降' ? '#ef4444' : '#f59e0b')}">${prediction.linear_regression?.trend_direction || '未知'}</span> |
          置信度: ${prediction.linear_regression?.confidence || '低'}
        </p>
        <div id="chart-prediction" style="width:100%;height:400px;"></div>
      </div>

      ${prediction.linear_regression?.predictions ? `
        <div class="stats-section">
          <h3 class="section-title">未来7天预测</h3>
          <div class="manage-table-wrapper">
            <table class="manage-table">
              <thead>
                <tr><th>天数</th><th>预测销售额</th><th>下限</th><th>上限</th></tr>
              </thead>
              <tbody>
                ${prediction.linear_regression.predictions.map(p => `
                  <tr>
                    <td>第 ${p.day} 天</td>
                    <td><strong style="color: var(--color-primary);">¥${p.predicted_sales}</strong></td>
                    <td>¥${p.lower_bound}</td>
                    <td>¥${p.upper_bound}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    setTimeout(() => {
      if (prediction.historical && prediction.linear_regression?.predictions) {
        window.charts.createPredictionChart(
          'chart-prediction',
          prediction.historical,
          prediction.linear_regression.predictions
        );
      } else if (prediction.historical) {
        window.charts.createTrendChart('chart-prediction', prediction.historical);
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
  }
}

// 加载异常检测标签
async function loadAnomaliesTab() {
  const content = document.getElementById('sales-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const user = window.auth.getCurrentUser();
    const result = await window.api.fetchSalesAnomalies(user.id, 30);

    const summary = result.summary || {};
    const anomalies = result.anomalies || [];

    content.innerHTML = `
      <div class="stats-cards" style="margin-bottom:20px;">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-info">
            <div class="stat-label">日均销售额</div>
            <div class="stat-value">¥${(summary.daily_mean || 0).toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚠️</div>
          <div class="stat-info">
            <div class="stat-label">异常天数</div>
            <div class="stat-value" style="color: ${summary.anomaly_count > 0 ? '#ef4444' : '#10b981'}">${summary.anomaly_count || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📏</div>
          <div class="stat-info">
            <div class="stat-label">告警阈值</div>
            <div class="stat-value">¥${(summary.upper_threshold || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      ${anomalies.length > 0 ? `
        <div class="stats-section">
          <h3 class="section-title" style="color: #ef4444;">🚨 检测到销售异常</h3>
          <div class="manage-table-wrapper">
            <table class="manage-table">
              <thead>
                <tr><th>日期</th><th>销售额</th><th>Z-Score</th><th>严重程度</th><th>方向</th><th>订单数</th></tr>
              </thead>
              <tbody>
                ${anomalies.map(a => `
                  <tr>
                    <td>${a.date}</td>
                    <td><strong>¥${a.sales_amount.toFixed(2)}</strong></td>
                    <td style="color: ${Math.abs(a.z_score) > 3 ? '#ef4444' : '#f59e0b'}; font-weight: 600;">${a.z_score > 0 ? '+' : ''}${a.z_score}</td>
                    <td><span style="color: ${a.severity === '严重异常' ? '#ef4444' : '#f59e0b'};">${a.severity}</span></td>
                    <td>${a.direction === '偏高' ? '📈 偏高' : '📉 偏低'}</td>
                    <td>${a.order_count} 单</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : `
        <div class="stats-section" style="text-align: center; padding: 40px; color: #10b981;">
          <div style="font-size: 3rem;">✅</div>
          <p>未检测到销售异常，系统运行正常</p>
        </div>
      `}
    `;

  } catch (err) {
    content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
  }
}

// 加载商品销售标签
async function loadProductsTab() {
  const content = document.getElementById('sales-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const stats = await window.api.fetchSalesStatistics('month');

    content.innerHTML = `
      <div class="products-sales-list">
        <h3 class="section-title">商品销售排行</h3>
        ${stats.topProducts.length === 0 ? '<p style="text-align: center; color: var(--color-text-muted); padding: 40px;">暂无销售数据</p>' :
          `<div id="chart-products-sales" style="width:100%;height:400px;"></div>
           <div class="manage-table-wrapper" style="margin-top:20px;">
            <table class="sales-table">
              <thead>
                <tr><th>排名</th><th>商品</th><th>销量</th><th>销售额</th><th>单价</th></tr>
              </thead>
              <tbody>
                ${stats.topProducts.map((p, index) => `
                  <tr>
                    <td><span class="rank-badge rank-${index < 3 ? index + 1 : ''}">${index + 1}</span></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${p.image_url || 'https://via.placeholder.com/50'}" alt="${p.name}" style="width:50px;height:50px;object-fit:cover;border-radius:8px;">
                        <span>${p.name}</span>
                      </div>
                    </td>
                    <td><strong>${p.sold_count}</strong> 件</td>
                    <td><span style="color: var(--color-primary); font-weight: 600;">￥${parseFloat(p.sales_amount).toFixed(2)}</span></td>
                    <td>￥${p.price}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>`
        }
      </div>
    `;

    setTimeout(() => {
      if (stats.topProducts && stats.topProducts.length > 0) {
        window.charts.createBarChart('chart-products-sales', stats.topProducts.map(p => ({
          name: p.name,
          sold_count: parseInt(p.sold_count),
          value: parseFloat(p.sales_amount)
        })));
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
  }
}

// 导出
window.sales = { showSalesStatistics };
