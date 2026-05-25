// ========== Admin 管理后台 ========== //

// 显示Admin管理后台
async function showAdminPanel() {
  console.log('👑 调用 showAdminPanel() - 显示管理后台');
  const main = document.getElementById('main-content');
  const user = window.auth.getCurrentUser();

  if (!user || user.role !== 'admin') {
    window.utils.showToast('权限不足');
    return;
  }

  main.innerHTML = `
    <div class="container">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 10px;" class="gradient-text">👑 管理后台</h2>
        <p style="color: var(--color-text-muted);">销售人员管理 · 全局统计 · 用户画像</p>
      </div>

      <div class="sales-tabs">
        <button class="sales-tab active" data-tab="sellers">销售人员管理</button>
        <button class="sales-tab" data-tab="overview">全局统计概览</button>
        <button class="sales-tab" data-tab="trend">销售趋势</button>
        <button class="sales-tab" data-tab="ranking">商品排行榜</button>
      </div>

      <div id="admin-content" style="margin-top: 30px;">
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
        case 'sellers': loadAdminSellers(); break;
        case 'overview': loadAdminOverview(); break;
        case 'trend': loadAdminTrend(); break;
        case 'ranking': loadAdminRanking(); break;
      }
    };
  });

  await loadAdminSellers();
}

// 加载销售人员管理
async function loadAdminSellers() {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const sellers = await window.api.fetchAdminSalesList();

    content.innerHTML = `
      <div style="margin-bottom: 20px; display: flex; gap: 15px;">
        <input type="number" id="add-seller-id" placeholder="输入用户ID添加为销售" class="filter-input" style="flex:1;">
        <button id="btn-add-seller" class="neon-btn btn-small">添加销售</button>
      </div>
      <div class="manage-table-wrapper">
        <table class="manage-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>销售额</th>
              <th>订单数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${sellers.map(s => `
              <tr>
                <td>${s.id}</td>
                <td>${s.username}</td>
                <td>${s.email}</td>
                <td><span class="status-${s.role === 'admin' ? '已完成' : '已支付'}">${s.role}</span></td>
                <td>¥${parseFloat(s.total_sales || 0).toFixed(2)}</td>
                <td>${s.order_count || 0}</td>
                <td>
                  <div style="display: flex; gap: 8px; justify-content: center;">
                    ${s.role !== 'admin' ? `<button class="btn-manage btn-delete" data-id="${s.id}" data-action="remove">移除</button>` : ''}
                    <button class="btn-manage btn-edit" data-id="${s.id}" data-action="reset">重置密码</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 添加销售
    document.getElementById('btn-add-seller').onclick = async () => {
      const userId = document.getElementById('add-seller-id').value;
      if (!userId) return alert('请输入用户ID');
      const res = await window.api.addSeller(userId);
      if (res.message) alert(res.message);
      loadAdminSellers();
    };

    // 移除/重置密码按钮
    document.querySelectorAll('.btn-manage').forEach(btn => {
      btn.onclick = async () => {
        const userId = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === 'remove') {
          if (!confirm('确定要移除此销售人员？')) return;
          const res = await window.api.removeSeller(userId);
          alert(res.message || JSON.stringify(res));
          loadAdminSellers();
        } else if (action === 'reset') {
          const newPwd = prompt('请输入新密码（至少6位）：');
          if (!newPwd || newPwd.length < 6) return alert('密码至少6位');
          const res = await window.api.resetPassword(userId, newPwd);
          alert(res.message || JSON.stringify(res));
        }
      };
    });

  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-accent);text-align:center;">加载失败: ${err.message}</div>`;
  }
}

// 加载全局统计概览
async function loadAdminOverview() {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const data = await window.api.fetchAdminOverview();

    content.innerHTML = `
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-info">
            <div class="stat-label">总销售额</div>
            <div class="stat-value">¥${parseFloat(data.overview.total_sales || 0).toFixed(2)}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-info">
            <div class="stat-label">总订单数</div>
            <div class="stat-value">${data.overview.total_orders || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-info">
            <div class="stat-label">买家数</div>
            <div class="stat-value">${data.overview.total_buyers || 0}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🛍️</div>
          <div class="stat-info">
            <div class="stat-label">商品总数</div>
            <div class="stat-value">${data.overview.total_products || 0}</div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <h3 class="section-title">销售人员业绩</h3>
        <div id="chart-seller-stats" style="width:100%;height:350px;"></div>
      </div>

      <div class="stats-section">
        <h3 class="section-title">类别销售分布</h3>
        <div id="chart-category-stats" style="width:100%;height:350px;"></div>
      </div>
    `;

    // 延迟渲染图表
    setTimeout(() => {
      if (data.sellerStats && data.sellerStats.length > 0) {
        window.charts.createBarChart('chart-seller-stats', data.sellerStats.map(s => ({
          name: s.username,
          sold_count: parseInt(s.order_count || 0),
          value: parseFloat(s.total_sales || 0)
        })));
      }
      if (data.categoryStats && data.categoryStats.length > 0) {
        window.charts.createBarChart('chart-category-stats', data.categoryStats.map(c => ({
          name: c.name,
          sold_count: parseInt(c.total_quantity || 0),
          value: parseFloat(c.total_sales || 0)
        })));
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-accent);text-align:center;">加载失败: ${err.message}</div>`;
  }
}

// 加载全局销售趋势
async function loadAdminTrend() {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const data = await window.api.fetchAdminTrend('day', 30);

    content.innerHTML = `
      <div class="stats-section">
        <h3 class="section-title">全局销售趋势（最近30天）</h3>
        <div id="chart-admin-trend" style="width:100%;height:400px;"></div>
      </div>
      <div class="stats-section">
        <h3 class="section-title">订单状态分布</h3>
        <div id="chart-admin-status" style="width:100%;height:350px;"></div>
      </div>
      <div class="stats-section">
        <h3 class="section-title">🔥 热销商品 Top 10</h3>
        <div class="top-products">
          ${(data.topProducts || []).map((p, i) => `
            <div class="top-product-item">
              <div class="product-rank">${i + 1}</div>
              <img src="${p.image_url || 'https://via.placeholder.com/60'}" alt="${p.name}" class="product-thumb">
              <div class="product-details">
                <div class="product-name">${p.name}</div>
                <div class="product-stats">销量: ${p.sold_count} | ¥${parseFloat(p.sales_amount).toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    setTimeout(() => {
      if (data.trend && data.trend.length > 0) {
        window.charts.createTrendChart('chart-admin-trend', data.trend);
      }
      if (data.statusStats && data.statusStats.length > 0) {
        window.charts.createPieChart('chart-admin-status', data.statusStats);
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-accent);text-align:center;">加载失败: ${err.message}</div>`;
  }
}

// 加载商品排行榜
async function loadAdminRanking() {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';

  try {
    const categories = await window.api.fetchCategories();
    const ranking = await window.api.fetchSalesRanking('sales', '', 20);

    content.innerHTML = `
      <div class="order-filters" style="margin-bottom:20px;">
        <select id="ranking-category" class="filter-select">
          <option value="">全部类别</option>
          ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        <select id="ranking-type" class="filter-select">
          <option value="sales">按销售额</option>
          <option value="quantity">按销量</option>
        </select>
        <button id="btn-refresh-ranking" class="neon-btn btn-small">刷新</button>
      </div>
      <div class="stats-section">
        <h3 class="section-title">商品排行榜</h3>
        <div id="chart-admin-ranking" style="width:100%;height:500px;"></div>
      </div>
      <div class="manage-table-wrapper" style="margin-top:20px;">
        <table class="manage-table">
          <thead>
            <tr><th>排名</th><th>商品</th><th>类别</th><th>价格</th><th>销量</th><th>销售额</th><th>库存</th></tr>
          </thead>
          <tbody>
            ${ranking.map((p, i) => `
              <tr>
                <td><span class="rank-badge rank-${i < 3 ? i + 1 : ''}">${i + 1}</span></td>
                <td>${p.name}</td>
                <td>${p.category_name || '-'}</td>
                <td>¥${p.price}</td>
                <td><strong>${p.sold_count}</strong> 件</td>
                <td><span style="color:var(--color-primary);">¥${parseFloat(p.sales_amount).toFixed(2)}</span></td>
                <td>${p.stock}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-refresh-ranking').onclick = async () => {
      const categoryId = document.getElementById('ranking-category').value;
      const type = document.getElementById('ranking-type').value;
      await loadAdminRankingFiltered(categoryId, type);
    };

    setTimeout(() => {
      if (ranking.length > 0) {
        window.charts.createBarChart('chart-admin-ranking', ranking.map(p => ({
          name: p.name,
          sold_count: parseInt(p.sold_count),
          value: parseFloat(p.sales_amount)
        })));
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-accent);text-align:center;">加载失败: ${err.message}</div>`;
  }
}

async function loadAdminRankingFiltered(categoryId, type) {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="loading-spinner">加载中...</div>';
  try {
    const categories = await window.api.fetchCategories();
    const ranking = await window.api.fetchSalesRanking(type, categoryId, 20);

    content.innerHTML = `
      <div class="order-filters" style="margin-bottom:20px;">
        <select id="ranking-category" class="filter-select">
          <option value="">全部类别</option>
          ${categories.map(c => `<option value="${c.id}" ${c.id == categoryId ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
        <select id="ranking-type" class="filter-select">
          <option value="sales" ${type === 'sales' ? 'selected' : ''}>按销售额</option>
          <option value="quantity" ${type === 'quantity' ? 'selected' : ''}>按销量</option>
        </select>
        <button id="btn-refresh-ranking" class="neon-btn btn-small">刷新</button>
      </div>
      <div class="stats-section">
        <h3 class="section-title">商品排行榜</h3>
        <div id="chart-admin-ranking" style="width:100%;height:500px;"></div>
      </div>
    `;

    document.getElementById('btn-refresh-ranking').onclick = () => loadAdminRankingFiltered(
      document.getElementById('ranking-category').value,
      document.getElementById('ranking-type').value
    );

    setTimeout(() => {
      if (ranking.length > 0) {
        window.charts.createBarChart('chart-admin-ranking', ranking.map(p => ({
          name: p.name,
          sold_count: parseInt(p.sold_count),
          value: parseFloat(p.sales_amount)
        })));
      }
    }, 300);

  } catch (err) {
    content.innerHTML = `<div style="color: var(--color-accent);text-align:center;">加载失败: ${err.message}</div>`;
  }
}

window.admin = { showAdminPanel };
