// ========== "我的" 综合页面 ========== //
console.log('👤 profile.js 已加载');

// 显示"我的"页面
async function showProfile() {
  const main = document.getElementById('main-content');
  const user = window.auth.getCurrentUser();

  if (!user) {
    window.utils.showToast('请先登录');
    return;
  }

  const role = user.role || 'buyer';
  const roleLabel = { buyer: '🛒 用户', seller: '📦 销售', admin: '👑 管理' }[role] || role;

  main.innerHTML = `
    <div class="container">
      <div style="margin-bottom: 30px;">
        <h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 8px;" class="gradient-text">👤 个人中心</h2>
        <p style="color: var(--color-text-muted); font-size: 0.95rem;">
          当前角色：<span style="color: var(--color-primary); font-weight: 600;">${roleLabel}</span>
          &nbsp;|&nbsp; 用户名：<span style="color: var(--color-primary); font-weight: 600;">${user.username}</span>
        </p>
      </div>

      <!-- Tab 导航 -->
      <div class="profile-tabs" id="profile-tabs" style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 24px; border-bottom: 2px solid rgba(148,163,184,0.15); padding-bottom: 0;">
        <button class="profile-tab active" data-tab="info" style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text); border-bottom: 3px solid var(--color-primary); margin-bottom: -2px; transition: all 0.3s;">📋 基本信息</button>
        <button class="profile-tab" data-tab="portrait" style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.3s;">📊 用户画像</button>
        <button class="profile-tab" data-tab="login-logs" style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.3s;">🔐 登录日志</button>
        ${role === 'seller' || role === 'admin' ? `
        <button class="profile-tab" data-tab="categories" style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.3s;">📂 品类管理</button>
        <button class="profile-tab" data-tab="browse-logs" style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.3s;">👁️ 浏览日志</button>
        <button class="profile-tab" data-tab="purchase-logs" style="padding: 10px 20px; border: none; background: none; cursor: pointer; font-size: 0.95rem; color: var(--color-text-muted); border-bottom: 3px solid transparent; margin-bottom: -2px; transition: all 0.3s;">🛒 购买日志</button>
        ` : ''}
      </div>

      <!-- Tab 内容 -->
      <div id="profile-content" style="min-height: 400px;"></div>
    </div>
  `;

  // 绑定Tab切换
  document.querySelectorAll('.profile-tab').forEach(tab => {
    tab.onclick = function() {
      document.querySelectorAll('.profile-tab').forEach(t => {
        t.classList.remove('active');
        t.style.color = 'var(--color-text-muted)';
        t.style.borderBottom = '3px solid transparent';
      });
      this.classList.add('active');
      this.style.color = 'var(--color-text)';
      this.style.borderBottom = '3px solid var(--color-primary)';
      loadProfileTab(this.dataset.tab);
    };
  });

  // 默认加载基本信息
  await loadProfileTab('info');
}

// 加载指定Tab内容
async function loadProfileTab(tabName) {
  const container = document.getElementById('profile-content');
  container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--color-text-muted);"><div class="loading-spinner"></div><p style="margin-top:12px;">加载中...</p></div>';

  try {
    switch (tabName) {
      case 'info': await loadInfoTab(container); break;
      case 'portrait': await loadPortraitTab(container); break;
      case 'login-logs': await loadLoginLogsTab(container); break;
      case 'categories': await loadCategoriesTab(container); break;
      case 'browse-logs': await loadBrowseLogsTab(container); break;
      case 'purchase-logs': await loadPurchaseLogsTab(container); break;
      default: container.innerHTML = '<p>未知Tab</p>';
    }
  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:60px;color:var(--color-accent);"><p>加载失败：${err.message}</p></div>`;
  }
}

// ==================== Tab: 基本信息 ====================
async function loadInfoTab(container) {
  const user = window.auth.getCurrentUser();
  try {
    const profileRes = await window.api.getProfile();
    const userInfo = profileRes.user || user;

    container.innerHTML = `
      <div class="glass-card" style="padding: 40px; max-width: 600px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); display: inline-flex; align-items: center; justify-content: center; font-size: 2rem;">👤</div>
          <h3 style="margin-top: 12px; font-size: 1.4rem;">${userInfo.username}</h3>
          <p style="color: var(--color-text-muted);">${userInfo.email}</p>
        </div>
        <div class="info-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div class="info-item"><span class="info-label">用户ID</span><span class="info-value">#${userInfo.id}</span></div>
          <div class="info-item"><span class="info-label">角色</span><span class="info-value">${{ buyer: '🛒 用户', seller: '📦 销售', admin: '👑 管理' }[userInfo.role || 'buyer'] || userInfo.role}</span></div>
          <div class="info-item"><span class="info-label">注册时间</span><span class="info-value">${userInfo.created_at ? new Date(userInfo.created_at).toLocaleString('zh-CN') : '-'}</span></div>
          <div class="info-item"><span class="info-label">邮箱</span><span class="info-value" style="font-size:0.9rem;">${userInfo.email}</span></div>
        </div>
      </div>
      <style>
        .info-item { background: rgba(148,163,184,0.05); border-radius: 10px; padding: 14px 16px; }
        .info-label { display: block; font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 4px; }
        .info-value { display: block; font-weight: 600; color: var(--color-text); }
      </style>
    `;
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding: 40px; text-align: center; color: var(--color-accent);">获取用户信息失败：${err.message}</div>`;
  }
}

// ==================== Tab: 用户画像 ====================
async function loadPortraitTab(container) {
  const user = window.auth.getCurrentUser();
  try {
    const data = await window.api.fetchUserProfile(user.id);
    const profile = data.profile;

    if (!profile) {
      container.innerHTML = `<div class="glass-card" style="padding: 40px; text-align: center; color: var(--color-text-muted);">暂无画像数据，可能还没有足够的活动记录。</div>`;
      return;
    }

    const powerColor = { high: '#10b981', medium: '#f59e0b', low: '#ef4444' };
    const powerLabel = { high: '💰 高消费力', medium: '🛍️ 中等消费力', low: '🔰 初级消费者' };

    let favHtml = '暂无';
    if (profile.favorite_categories) {
      try {
        const favs = typeof profile.favorite_categories === 'string' ? JSON.parse(profile.favorite_categories) : profile.favorite_categories;
        favHtml = favs.map(f => `<span class="tag">${f.name} (${f.cnt}次)</span>`).join(' ') || '暂无';
      } catch (e) { favHtml = '数据异常'; }
    }

    container.innerHTML = `
      <div class="glass-card" style="padding: 40px;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
          <div class="stat-card-small" style="border-left: 4px solid ${powerColor[profile.purchasing_power] || '#94a3b8'};">
            <div class="stat-label-small">购买力</div>
            <div class="stat-value-small" style="color: ${powerColor[profile.purchasing_power] || '#94a3b8'};">${powerLabel[profile.purchasing_power] || profile.purchasing_power || '-'}</div>
          </div>
          <div class="stat-card-small" style="border-left: 4px solid var(--color-primary);">
            <div class="stat-label-small">累计消费</div>
            <div class="stat-value-small">¥${parseFloat(profile.total_spent || 0).toFixed(2)}</div>
          </div>
          <div class="stat-card-small" style="border-left: 4px solid var(--color-secondary);">
            <div class="stat-label-small">订单数</div>
            <div class="stat-value-small">${profile.order_count || 0}</div>
          </div>
          <div class="stat-card-small" style="border-left: 4px solid var(--color-accent);">
            <div class="stat-label-small">平均客单价</div>
            <div class="stat-value-small">¥${parseFloat(profile.avg_order_value || 0).toFixed(2)}</div>
          </div>
          <div class="stat-card-small" style="border-left: 4px solid #8b5cf6;">
            <div class="stat-label-small">浏览总数</div>
            <div class="stat-value-small">${profile.browse_count || 0}</div>
          </div>
          <div class="stat-card-small" style="border-left: 4px solid #06b6d4;">
            <div class="stat-label-small">所在地区</div>
            <div class="stat-value-small">${profile.region || '未知'}</div>
          </div>
        </div>
        <div style="background: rgba(148,163,184,0.05); border-radius: 12px; padding: 20px;">
          <h4 style="margin-bottom: 12px; color: var(--color-text);">偏好分类</h4>
          <div style="font-size: 0.95rem; color: var(--color-text-muted);">${profile.preference_category || '暂无数据'}</div>
          ${favHtml !== '暂无' ? `<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 8px;">${favHtml}</div>` : ''}
        </div>
        <div style="margin-top: 20px; text-align: right;">
          <button onclick="window.profile.refreshPortrait()" class="neon-btn" style="font-size:0.9rem;">🔄 刷新画像</button>
        </div>
      </div>
      <style>
        .stat-card-small { background: rgba(148,163,184,0.05); border-radius: 12px; padding: 16px 20px; }
        .stat-label-small { font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 6px; }
        .stat-value-small { font-size: 1.3rem; font-weight: 700; }
        .tag { display: inline-block; padding: 4px 12px; border-radius: 20px; background: rgba(30,144,255,0.15); color: var(--color-primary); font-size: 0.85rem; }
      </style>
    `;
  } catch (err) {
    container.innerHTML = `<div class="glass-card" style="padding: 40px; text-align: center; color: var(--color-accent);">加载画像失败：${err.message}</div>`;
  }
}

// ==================== Tab: 品类管理（Seller） ====================
async function loadCategoriesTab(container) {
  container.innerHTML = `
    <div class="glass-card" style="padding: 30px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="font-size: 1.2rem;">📂 商品品类管理</h3>
        <button id="btn-add-category" class="neon-btn" style="font-size:0.9rem;">+ 添加品类</button>
      </div>
      <div id="add-category-form" style="display:none; margin-bottom: 20px; padding: 20px; background: rgba(148,163,184,0.05); border-radius: 12px;">
        <div style="display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--color-text-muted);">品类名称</label>
            <input id="new-cat-name" class="form-input-modern" style="width:100%;" placeholder="如：数码配件">
          </div>
          <div style="flex: 2; min-width: 200px;">
            <label style="display:block; margin-bottom:4px; font-size:0.85rem; color:var(--color-text-muted);">描述</label>
            <input id="new-cat-desc" class="form-input-modern" style="width:100%;" placeholder="品类描述（可选）">
          </div>
          <button id="btn-save-category" class="neon-btn" style="font-size:0.9rem;">保存</button>
          <button id="btn-cancel-category" class="neon-btn" style="background:rgba(148,163,184,0.2); font-size:0.9rem;">取消</button>
        </div>
        <div id="cat-form-error" style="color:var(--color-accent); margin-top:8px; font-size:0.85rem;"></div>
      </div>
      <div id="categories-table-container">加载中...</div>
    </div>
  `;

  // 添加品类按钮
  document.getElementById('btn-add-category').onclick = () => {
    document.getElementById('add-category-form').style.display = 'block';
    document.getElementById('new-cat-name').focus();
  };
  document.getElementById('btn-cancel-category').onclick = () => {
    document.getElementById('add-category-form').style.display = 'none';
    document.getElementById('new-cat-name').value = '';
    document.getElementById('new-cat-desc').value = '';
    document.getElementById('cat-form-error').textContent = '';
  };
  document.getElementById('btn-save-category').onclick = async () => {
    const name = document.getElementById('new-cat-name').value.trim();
    const desc = document.getElementById('new-cat-desc').value.trim();
    const errEl = document.getElementById('cat-form-error');
    if (!name) { errEl.textContent = '请输入品类名称'; return; }
    try {
      const result = await window.api.createCategory(name, desc);
      if (result.message === '类别创建成功') {
        window.utils.showToast('品类创建成功');
        document.getElementById('add-category-form').style.display = 'none';
        document.getElementById('new-cat-name').value = '';
        document.getElementById('new-cat-desc').value = '';
        await loadCategoriesTable(document.getElementById('categories-table-container'));
      } else {
        errEl.textContent = result.message || '创建失败';
      }
    } catch (err) {
      errEl.textContent = '创建失败：' + err.message;
    }
  };

  await loadCategoriesTable(document.getElementById('categories-table-container'));
}

async function loadCategoriesTable(container) {
  try {
    const data = await window.api.fetchCategories();
    const categories = data.categories || data || [];
    if (categories.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无品类</div>';
      return;
    }
    container.innerHTML = `
      <div class="manage-table-wrapper">
        <table class="manage-table">
          <thead><tr><th>ID</th><th>名称</th><th>描述</th><th>创建时间</th><th style="width:160px;">操作</th></tr></thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td>#${c.id}</td>
                <td><strong>${c.name}</strong></td>
                <td style="color:var(--color-text-muted);font-size:0.9rem;">${c.description || '-'}</td>
                <td style="color:var(--color-text-muted);font-size:0.85rem;">${new Date(c.created_at).toLocaleDateString('zh-CN')}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn-manage btn-edit" data-cat-id="${c.id}" data-cat-name="${c.name}" data-cat-desc="${c.description || ''}">✏️</button>
                    <button class="btn-manage btn-delete" data-cat-id="${c.id}">🗑️</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // 编辑按钮
    container.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = () => editCategory(btn.dataset.catId, btn.dataset.catName, btn.dataset.catDesc);
    });
    // 删除按钮
    container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('确定删除该品类？')) return;
        const res = await window.api.deleteCategory(btn.dataset.catId);
        if (res.message === '类别删除成功') {
          window.utils.showToast('品类已删除');
          await loadCategoriesTable(container);
        } else {
          window.utils.showToast('删除失败：' + (res.message || ''));
        }
      };
    });
  } catch (err) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--color-accent);">加载失败：${err.message}</div>`;
  }
}

function editCategory(id, name, desc) {
  const newName = prompt('修改品类名称：', name);
  if (newName === null) return;
  if (!newName.trim()) { window.utils.showToast('名称不能为空'); return; }
  const newDesc = prompt('修改品类描述：', desc || '');
  if (newDesc === null) return;
  window.api.updateCategory(id, newName.trim(), (newDesc || '').trim()).then(res => {
    if (res.message === '类别更新成功') {
      window.utils.showToast('品类已更新');
      const container = document.getElementById('categories-table-container');
      if (container) loadCategoriesTable(container);
    } else {
      window.utils.showToast('更新失败：' + (res.message || ''));
    }
  });
}

// ==================== Tab: 浏览日志 ====================
async function loadBrowseLogsTab(container) {
  let page = 1;
  const limit = 15;

  async function render() {
    try {
      const data = await window.api.fetchBrowseLogs({ page, limit });
      const logs = data.logs || [];
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit);

      let html = `
        <div class="glass-card" style="padding: 20px;">
          <h3 style="margin-bottom: 16px; font-size: 1.15rem;">👁️ 用户浏览记录 <span style="font-size:0.85rem;color:var(--color-text-muted);">(共 ${total} 条)</span></h3>
          <div class="manage-table-wrapper" style="max-height: 500px; overflow-y: auto;">
            <table class="manage-table">
              <thead><tr><th>用户</th><th>商品</th><th>品类</th><th>开始时间</th><th>停留(秒)</th><th>IP</th></tr></thead>
              <tbody>
      `;

      if (logs.length === 0) {
        html += '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无浏览记录</td></tr>';
      } else {
        logs.forEach(log => {
          html += `
            <tr>
              <td>${log.username || '游客'}</td>
              <td>${log.product_name || '-'}</td>
              <td>${log.category_name || '-'}</td>
              <td style="font-size:0.85rem;">${new Date(log.start_time).toLocaleString('zh-CN')}</td>
              <td>${log.duration_seconds || 0}s</td>
              <td style="font-size:0.8rem;color:var(--color-text-muted);">${log.ip_address || '-'}</td>
            </tr>
          `;
        });
      }

      html += `
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-top:16px;">
            <button id="browse-prev" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page <= 1 ? 'disabled' : ''}>上一页</button>
            <span style="color:var(--color-text-muted);font-size:0.9rem;">第 ${page} / ${totalPages} 页</span>
            <button id="browse-next" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      `;

      container.innerHTML = html;

      document.getElementById('browse-prev').onclick = () => { if (page > 1) { page--; render(); } };
      document.getElementById('browse-next').onclick = () => { if (page < totalPages) { page++; render(); } };
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="padding:40px;text-align:center;color:var(--color-accent);">加载失败：${err.message}</div>`;
    }
  }

  await render();
}

// ==================== Tab: 购买日志 ====================
async function loadPurchaseLogsTab(container) {
  let page = 1;
  const limit = 10;

  async function render(statusFilter = '') {
    try {
      const params = { page, limit };
      if (statusFilter) params.status = statusFilter;
      const data = await window.api.fetchPurchaseLogs(params);
      const logs = data.logs || [];
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit);

      const statusColor = {
        '待支付': '#f59e0b', '已支付': '#3b82f6', '已发货': '#8b5cf6', '已完成': '#10b981', '已取消': '#ef4444'
      };

      let html = `
        <div class="glass-card" style="padding: 20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <h3 style="font-size: 1.15rem;">🛒 购买/订单记录 <span style="font-size:0.85rem;color:var(--color-text-muted);">(共 ${total} 条)</span></h3>
            <select id="purchase-status-filter" style="padding:6px 12px;border-radius:8px;border:1px solid rgba(148,163,184,0.3);background:var(--color-bg);color:var(--color-text);">
              <option value="">全部状态</option>
              <option value="待支付" ${statusFilter === '待支付' ? 'selected' : ''}>待支付</option>
              <option value="已支付" ${statusFilter === '已支付' ? 'selected' : ''}>已支付</option>
              <option value="已发货" ${statusFilter === '已发货' ? 'selected' : ''}>已发货</option>
              <option value="已完成" ${statusFilter === '已完成' ? 'selected' : ''}>已完成</option>
              <option value="已取消" ${statusFilter === '已取消' ? 'selected' : ''}>已取消</option>
            </select>
          </div>
      `;

      if (logs.length === 0) {
        html += '<div style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无订单记录</div>';
      } else {
        logs.forEach(order => {
          const itemsHtml = (order.items || []).map(i => `
            <div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.85rem;">
              <img src="${i.image_url || 'https://via.placeholder.com/40'}" style="width:32px;height:32px;object-fit:cover;border-radius:6px;" alt="">
              <span>${i.product_name || '商品'}</span>
              ${i.category_name ? `<span style="background:rgba(30,144,255,0.12);color:#60a5fa;padding:1px 6px;border-radius:10px;font-size:0.75rem;">${i.category_name}</span>` : ''}
              <span style="color:var(--color-text-muted);">x${i.quantity}</span>
              <span style="color:var(--color-primary);">¥${i.price}</span>
            </div>
          `).join('');

          html += `
            <div style="background:rgba(148,163,184,0.04);border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid rgba(148,163,184,0.1);">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
                <div>
                  <strong>订单 #${order.id}</strong>
                  <span style="margin-left:8px;color:var(--color-text-muted);font-size:0.85rem;">${order.buyer_name || '-'}</span>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                  <span style="padding:3px 10px;border-radius:20px;font-size:0.8rem;background:${statusColor[order.status] || '#94a3b8'}22;color:${statusColor[order.status] || '#94a3b8'};border:1px solid ${statusColor[order.status] || '#94a3b8'}44;">${order.status}</span>
                  <strong style="color:var(--color-primary);">¥${parseFloat(order.total_price || 0).toFixed(2)}</strong>
                </div>
              </div>
              <div style="margin-bottom:8px;">${itemsHtml}</div>
              <div style="display:flex;gap:16px;font-size:0.8rem;color:var(--color-text-muted);flex-wrap:wrap;">
                ${order.payment_method ? `<span>支付方式：${order.payment_method}</span>` : ''}
                ${order.payment_time ? `<span>支付时间：${new Date(order.payment_time).toLocaleString('zh-CN')}</span>` : ''}
                ${order.tracking_number ? `<span>快递单号：${order.tracking_number} (${order.carrier || '-'})</span>` : ''}
                <span>创建时间：${new Date(order.created_at).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          `;
        });
      }

      html += `
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-top:16px;">
            <button id="purchase-prev" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page <= 1 ? 'disabled' : ''}>上一页</button>
            <span style="color:var(--color-text-muted);font-size:0.9rem;">第 ${page} / ${totalPages} 页</span>
            <button id="purchase-next" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      `;

      container.innerHTML = html;

      document.getElementById('purchase-prev').onclick = () => { if (page > 1) { page--; render(statusFilter); } };
      document.getElementById('purchase-next').onclick = () => { if (page < totalPages) { page++; render(statusFilter); } };
      document.getElementById('purchase-status-filter').onchange = function() {
        page = 1;
        render(this.value);
      };
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="padding:40px;text-align:center;color:var(--color-accent);">加载失败：${err.message}</div>`;
    }
  }

  await render();
}

// ==================== Tab: 登录日志 ====================
async function loadLoginLogsTab(container) {
  const user = window.auth.getCurrentUser();
  let page = 1;
  const limit = 15;

  async function render() {
    try {
      const data = await window.api.fetchLoginLogs({ userId: user.id, page, limit });
      const logs = data.logs || [];
      const total = data.total || 0;
      const totalPages = Math.ceil(total / limit);

      let html = `
        <div class="glass-card" style="padding: 20px;">
          <h3 style="margin-bottom: 16px; font-size: 1.15rem;">🔐 登录日志 <span style="font-size:0.85rem;color:var(--color-text-muted);">(共 ${total} 条)</span></h3>
          <div class="manage-table-wrapper" style="max-height: 500px; overflow-y: auto;">
            <table class="manage-table">
              <thead><tr><th>时间</th><th>操作</th><th>IP地址</th><th>设备信息</th></tr></thead>
              <tbody>
      `;

      if (logs.length === 0) {
        html += '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无登录记录</td></tr>';
      } else {
        logs.forEach(log => {
          const actionLabel = log.action === 'login' ? '✅ 登录' : '🚪 登出';
          const ua = log.user_agent ? (log.user_agent.length > 60 ? log.user_agent.substring(0, 60) + '...' : log.user_agent) : '-';
          html += `
            <tr>
              <td style="font-size:0.9rem;">${new Date(log.login_time).toLocaleString('zh-CN')}</td>
              <td>${actionLabel}</td>
              <td style="font-size:0.85rem;font-family:monospace;">${log.ip_address || '-'}</td>
              <td style="font-size:0.75rem;color:var(--color-text-muted);">${ua}</td>
            </tr>
          `;
        });
      }

      html += `
              </tbody>
            </table>
          </div>
          <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-top:16px;">
            <button id="loginlog-prev" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page <= 1 ? 'disabled' : ''}>上一页</button>
            <span style="color:var(--color-text-muted);font-size:0.9rem;">第 ${page} / ${totalPages} 页</span>
            <button id="loginlog-next" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
          </div>
        </div>
      `;

      container.innerHTML = html;

      document.getElementById('loginlog-prev').onclick = () => { if (page > 1) { page--; render(); } };
      document.getElementById('loginlog-next').onclick = () => { if (page < totalPages) { page++; render(); } };
    } catch (err) {
      container.innerHTML = `<div class="glass-card" style="padding:40px;text-align:center;color:var(--color-accent);">加载失败：${err.message}</div>`;
    }
  }

  await render();
}

// 刷新用户画像
async function refreshPortrait() {
  const user = window.auth.getCurrentUser();
  try {
    window.utils.showToast('正在刷新画像...');
    // 直接重新查询画像会触发后端即时生成
    const data = await window.api.fetchUserProfile(user.id);
    if (data.profile) {
      const container = document.getElementById('profile-content');
      if (container) await loadPortraitTab(container);
      window.utils.showToast('画像已刷新');
    }
  } catch (err) {
    window.utils.showToast('刷新失败：' + err.message);
  }
}

// 导出
window.profile = {
  showProfile,
  refreshPortrait,
  loadProfileTab
};
console.log('✅ window.profile 已导出:', window.profile);
