// ========== 商品相关UI ========== //

let currentBrowseId = null; // 当前浏览记录ID

// 显示商品列表页
async function showProductList(searchKeyword = '') {
  console.log('🛍️ 调用 showProductList() - 显示所有商品列表');
  const main = document.getElementById('main-content');

  // 加载类别列表
  const categories = await window.api.fetchCategories().catch(() => []);

  main.innerHTML = `
    <div class="container">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 10px;" class="gradient-text">🛍️ 精选商品</h2>
        <p style="color: var(--color-text-muted); font-size: 1rem;">浏览所有商品，发现你喜欢的商品</p>
      </div>

      <!-- 搜索框 + 类别筛选 -->
      <div class="search-container">
        <div class="search-box">
          <input 
            type="text" 
            id="product-search-input" 
            placeholder="🔍 搜索商品名称或描述..." 
            value="${searchKeyword}"
          />
          <button id="product-search-btn" class="neon-btn">搜索</button>
        </div>
        <select id="category-filter" class="filter-select" style="margin-left:10px;">
          <option value="">全部类别</option>
          ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
        </select>
        ${searchKeyword ? `<button onclick="window.products.showProductList('')" class="clear-search-btn neon-btn">✕ 清空搜索</button>` : ''}
      </div>

      <!-- 个性化推荐区（仅登录用户） -->
      <div id="personal-recommend-section" style="margin-bottom: 30px;"></div>

      <div id="product-list">加载中...</div>
    </div>
  `;

  // 获取商品列表
  const products = await window.api.fetchProducts(searchKeyword);
  const html = products.map(p => `
    <div class="product-item" data-id="${p.id}">
      <img src="${p.image_url || 'https://via.placeholder.com/400x300'}" alt="${p.name}" class="product-img">
      <div class="product-overlay">
        <div class="overlay-actions">
          <button class="btn-detail" data-id="${p.id}">查看详情</button>
          <button class="btn-addcart" data-id="${p.id}">加入购物车</button>
        </div>
      </div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>￥${p.price}</p>
      </div>
    </div>
  `).join('');
  document.getElementById('product-list').innerHTML = html || `<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">${searchKeyword ? '未找到匹配的商品' : '暂无商品'}</div>`;

  // 加载个性化推荐
  loadPersonalRecommendations();

  // 搜索功能
  const searchInput = document.getElementById('product-search-input');
  const searchBtn = document.getElementById('product-search-btn');

  searchBtn.onclick = () => {
    const keyword = searchInput.value.trim();
    showProductList(keyword);
  };

  searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
      const keyword = searchInput.value.trim();
      showProductList(keyword);
    }
  };

  // 类别筛选
  document.getElementById('category-filter').onchange = () => {
    // 暂时通过服务端筛选（如果 product API 支持 category_id 参数）
    // 简化处理：前端过滤
    const catId = document.getElementById('category-filter').value;
    loadProductsByCategory(catId);
  };

  // 点击商品卡片进入详情（除非点击的是按钮）
  document.querySelectorAll('.product-item').forEach(item => {
    item.onclick = (e) => {
      if (e.target.classList.contains('btn-detail') || e.target.classList.contains('btn-addcart')) {
        return;
      }
      showProductDetail(item.dataset.id);
    };
  });

  // 详情按钮
  document.querySelectorAll('.btn-detail').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      showProductDetail(btn.dataset.id);
    };
  });

  // 加入购物车按钮
  document.querySelectorAll('.btn-addcart').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const product = await window.api.fetchProductDetail(btn.dataset.id);
      window.cart.addToCart(product, 1);
      window.utils.showToast('✓ 已加入购物车');
    };
  });
}

// 按类别加载商品
async function loadProductsByCategory(categoryId) {
  const container = document.getElementById('product-list');
  if (!categoryId) {
    return showProductList();
  }
  container.innerHTML = '<div class="loading-spinner">加载中...</div>';
  const allProducts = await window.api.fetchProducts();
  // 前端按类别筛选（简化方案）
  const filtered = allProducts.filter(p => p.category_id == categoryId);
  const html = filtered.map(p => `
    <div class="product-item" data-id="${p.id}">
      <img src="${p.image_url || 'https://via.placeholder.com/400x300'}" alt="${p.name}" class="product-img">
      <div class="product-overlay">
        <div class="overlay-actions">
          <button class="btn-detail" data-id="${p.id}">查看详情</button>
          <button class="btn-addcart" data-id="${p.id}">加入购物车</button>
        </div>
      </div>
      <div class="product-info"><h3>${p.name}</h3><p>￥${p.price}</p></div>
    </div>
  `).join('');
  container.innerHTML = html || '<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">该类别暂无商品</div>';

  document.querySelectorAll('.btn-detail').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); showProductDetail(btn.dataset.id); };
  });
  document.querySelectorAll('.btn-addcart').forEach(btn => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const product = await window.api.fetchProductDetail(btn.dataset.id);
      window.cart.addToCart(product, 1);
      window.utils.showToast('✓ 已加入购物车');
    };
  });
}

// 加载个性化推荐
async function loadPersonalRecommendations() {
  const section = document.getElementById('personal-recommend-section');
  if (!section) return;
  const user = window.auth.getCurrentUser();
  if (!user) return;

  try {
    const recommendations = await window.api.fetchPersonalRecommend(6);
    if (recommendations.length === 0) return;

    section.innerHTML = `
      <div style="text-align: center; margin: 30px 0 20px;">
        <h3 style="color: var(--color-primary); font-size: 1.3rem;">🎯 为您推荐</h3>
        <p style="color: var(--color-text-muted); font-size: 0.85rem;">基于您的浏览和购买偏好</p>
      </div>
      <div class="product-grid recommend-grid">
        ${recommendations.map(p => `
          <div class="product-item" data-id="${p.id}" style="border: 1px solid rgba(30,144,255,0.2);">
            <img src="${p.image_url || 'https://via.placeholder.com/400x300'}" alt="${p.name}" class="product-img">
            <div class="product-info"><h3>${p.name}</h3><p>￥${p.price}</p></div>
          </div>
        `).join('')}
      </div>
    `;

    section.querySelectorAll('.product-item').forEach(item => {
      item.onclick = () => showProductDetail(item.dataset.id);
    });
  } catch (err) {
    console.log('推荐加载失败:', err);
  }
}

// 显示商品详情页（含推荐 + 浏览埋点）
async function showProductDetail(id) {
  // 结束上一浏览
  if (currentBrowseId) {
    window.api.endBrowseTracking(currentBrowseId).catch(() => {});
    currentBrowseId = null;
  }

  const main = document.getElementById('main-content');
  const p = await window.api.fetchProductDetail(id);

  // 开始浏览埋点
  try {
    const browseRes = await window.api.startBrowseTracking(p.id, p.category_id);
    currentBrowseId = browseRes.browse_id;
  } catch (err) { /* ignore */ }

  main.innerHTML = `
    <div class="container">
      <div class="product-detail">
        <div class="detail-image-wrapper">
          <img src="${p.image_url || 'https://via.placeholder.com/600x500'}" alt="${p.name}" class="product-img-large">
        </div>
        <div class="detail-info">
          <h2 class="detail-title">${p.name}</h2>
          <div class="detail-price">￥${p.price}</div>
          <div class="detail-description">
            <h3>商品描述</h3>
            <p>${p.description || '暂无描述'}</p>
          </div>
          <div class="detail-stock">
            <span class="stock-label">库存:</span>
            <span class="stock-value ${p.stock > 0 ? 'in-stock' : 'out-stock'}">${p.stock > 0 ? p.stock + ' 件' : '缺货'}</span>
          </div>
          <div class="detail-actions">
            <div class="quantity-selector">
              <button class="qty-btn" id="qty-minus">−</button>
              <input type="number" id="qty-input" value="1" min="1" max="${p.stock}" readonly>
              <button class="qty-btn" id="qty-plus">+</button>
            </div>
            <button class="neon-btn btn-large" id="btn-addcart-detail" ${p.stock <= 0 ? 'disabled' : ''}>
              <span>加入购物车</span>
            </button>
            <button class="neon-btn btn-secondary" id="btn-back">
              <span>← 返回列表</span>
            </button>
          </div>
        </div>
      </div>

      <!-- "浏览过此商品的人也买了..." -->
      <div id="also-bought-section" style="margin-top: 40px;">
        <div class="loading-spinner">加载推荐中...</div>
      </div>
    </div>
  `;

  // 数量选择器
  let quantity = 1;
  const qtyInput = document.getElementById('qty-input');
  document.getElementById('qty-minus').onclick = () => { if (quantity > 1) { quantity--; qtyInput.value = quantity; } };
  document.getElementById('qty-plus').onclick = () => { if (quantity < p.stock) { quantity++; qtyInput.value = quantity; } };

  document.getElementById('btn-addcart-detail').onclick = () => {
    if (p.stock <= 0) return;
    window.cart.addToCart(p, quantity);
    window.utils.showToast(`✓ 已添加 ${quantity} 件到购物车`);
  };

  document.getElementById('btn-back').onclick = () => {
    endCurrentBrowse();
    showProductList();
  };

  // 加载关联推荐
  loadAlsoBought(id);

  // 页面离开时结束浏览计时
  window.addEventListener('beforeunload', endCurrentBrowse);
}

function endCurrentBrowse() {
  if (currentBrowseId) {
    window.api.endBrowseTracking(currentBrowseId).catch(() => {});
    currentBrowseId = null;
  }
}

// 加载"浏览过此商品的人也买了..."
async function loadAlsoBought(productId) {
  const section = document.getElementById('also-bought-section');
  try {
    const recommendations = await window.api.fetchAlsoBought(productId, 6);
    if (recommendations.length === 0) {
      section.innerHTML = '<div style="text-align:center;color:var(--color-text-muted);padding:20px;">暂无相关推荐</div>';
      return;
    }

    section.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h3 style="color: var(--color-primary); font-size: 1.3rem;">👀 浏览过此商品的人也买了...</h3>
      </div>
      <div class="product-grid">
        ${recommendations.map(p => `
          <div class="product-item also-bought-item" data-id="${p.id}">
            <img src="${p.image_url || 'https://via.placeholder.com/400x300'}" alt="${p.name}" class="product-img">
            <div class="product-info"><h3>${p.name}</h3><p>￥${p.price}</p></div>
            <div class="product-overlay">
              <div class="overlay-actions">
                <button class="btn-detail" data-id="${p.id}">查看详情</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    section.querySelectorAll('.also-bought-item').forEach(item => {
      item.onclick = () => {
        endCurrentBrowse();
        showProductDetail(item.dataset.id);
      };
    });
  } catch (err) {
    section.innerHTML = '';
  }
}

// 导出商品函数
window.products = {
  showProductList,
  showProductDetail,
  endCurrentBrowse
};
