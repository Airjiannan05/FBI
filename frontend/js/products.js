// ========== 商品相关UI ========== //

// 显示商品列表页
async function showProductList(searchKeyword = '') {
	const main = document.getElementById('main-content');
	main.innerHTML = `
		<div class="container">
			<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 30px; text-align: center;" class="gradient-text">精选商品</h2>
			
			<!-- 搜索框 -->
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
				${searchKeyword ? `<button onclick="window.products.showProductList('')" class="clear-search-btn neon-btn">✕ 清空搜索</button>` : ''}
			</div>
			
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
	
	// 搜索功能
	const searchInput = document.getElementById('product-search-input');
	const searchBtn = document.getElementById('product-search-btn');
	
	// 搜索按钮点击
	searchBtn.onclick = () => {
		const keyword = searchInput.value.trim();
		showProductList(keyword);
	};
	
	// 回车键搜索
	searchInput.onkeypress = (e) => {
		if (e.key === 'Enter') {
			const keyword = searchInput.value.trim();
			showProductList(keyword);
		}
	};
	
	// 输入框获得焦点样式
	searchInput.onfocus = () => {
		searchInput.style.borderColor = '#1e90ff';
		searchInput.style.boxShadow = '0 0 20px rgba(30, 144, 255, 0.3)';
	};
	
	searchInput.onblur = () => {
		searchInput.style.borderColor = 'rgba(30, 144, 255, 0.3)';
		searchInput.style.boxShadow = 'none';
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

// 显示商品详情页
async function showProductDetail(id) {
	const main = document.getElementById('main-content');
	const p = await window.api.fetchProductDetail(id);
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
		</div>
	`;
	
	// 数量选择器
	let quantity = 1;
	const qtyInput = document.getElementById('qty-input');
	const qtyMinus = document.getElementById('qty-minus');
	const qtyPlus = document.getElementById('qty-plus');
	
	qtyMinus.onclick = () => {
		if (quantity > 1) {
			quantity--;
			qtyInput.value = quantity;
		}
	};
	
	qtyPlus.onclick = () => {
		if (quantity < p.stock) {
			quantity++;
			qtyInput.value = quantity;
		}
	};
	
	// 加入购物车
	document.getElementById('btn-addcart-detail').onclick = () => {
		if (p.stock <= 0) return;
		window.cart.addToCart(p, quantity);
		window.utils.showToast(`✓ 已添加 ${quantity} 件到购物车`);
	};
	
	// 返回按钮
	document.getElementById('btn-back').onclick = () => {
		showProductList();
	};
}

// 导出商品函数
window.products = {
	showProductList,
	showProductDetail
};
