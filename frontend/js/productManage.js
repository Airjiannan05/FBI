// ========== 销售人员商品管理工作台 ========== //
console.log('📦 productManage.js 已加载');

let editImageFile = null;

function formatCurrency(value) {
	return `￥${parseFloat(value || 0).toFixed(2)}`;
}

function formatDateTime(value) {
	return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

function getStatusColor(status) {
	return {
		'待支付': '#f59e0b',
		'已支付': '#3b82f6',
		'已发货': '#8b5cf6',
		'已完成': '#10b981',
		'已取消': '#ef4444'
	}[status] || '#94a3b8';
}

async function showMyProducts() {
	const main = document.getElementById('main-content');
	const user = window.auth.getCurrentUser();
	if (!user) {
		window.utils.showToast('请先登录');
		return;
	}

	main.innerHTML = `
		<div class="container">
			<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap;margin-bottom:24px;">
				<div>
					<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 8px;" class="gradient-text">销售工作台</h2>
					<p style="color: var(--color-text-muted); font-size: 0.95rem;">目录管理、商品价格库存、销售状态和用户行为日志</p>
				</div>
				<button id="btn-add-product" class="neon-btn"><span>+ 发布新商品</span></button>
			</div>

			<div class="sales-tabs" id="seller-workbench-tabs" style="justify-content:flex-start;margin-bottom:24px;">
				<button class="sales-tab active" data-tab="products">商品信息</button>
				<button class="sales-tab" data-tab="categories">目录管理</button>
				<button class="sales-tab" data-tab="status">销售状态</button>
				<button class="sales-tab" data-tab="browse-logs">浏览日志</button>
				<button class="sales-tab" data-tab="purchase-logs">购买日志</button>
			</div>

			<div id="seller-workbench-content">加载中...</div>
		</div>
	`;

	document.getElementById('btn-add-product').onclick = () => window.sell.showSellModal();
	document.querySelectorAll('#seller-workbench-tabs .sales-tab').forEach(tab => {
		tab.onclick = () => {
			document.querySelectorAll('#seller-workbench-tabs .sales-tab').forEach(t => t.classList.remove('active'));
			tab.classList.add('active');
			loadWorkbenchTab(tab.dataset.tab);
		};
	});

	await loadWorkbenchTab('products');
}

async function loadWorkbenchTab(tabName) {
	const container = document.getElementById('seller-workbench-content');
	if (!container) return;
	container.innerHTML = '<div class="loading-spinner">加载中...</div>';

	try {
		if (tabName === 'products') await loadMyProducts();
		if (tabName === 'categories') await loadCategoriesTab(container);
		if (tabName === 'status') await loadSalesStatusTab(container);
		if (tabName === 'browse-logs') await loadBrowseLogsTab(container);
		if (tabName === 'purchase-logs') await loadPurchaseLogsTab(container);
	} catch (err) {
		container.innerHTML = `<div class="glass-card" style="padding:40px;text-align:center;color:var(--color-accent);">加载失败：${err.message}</div>`;
	}
}

async function loadMyProducts() {
	const response = await window.api.fetchMyProducts();
	const products = response.products || [];
	const listContainer = document.getElementById('seller-workbench-content') || document.getElementById('my-products-list');

	if (products.length === 0) {
		listContainer.innerHTML = `
			<div style="text-align:center;padding:60px;color:var(--color-text-muted);">
				<div style="font-size:3rem;margin-bottom:20px;">📦</div>
				<p style="font-size:1.2rem;margin-bottom:20px;">暂无商品</p>
				<button onclick="window.sell.showSellModal()" class="neon-btn"><span>立即发布</span></button>
			</div>
		`;
		return;
	}

	listContainer.innerHTML = `
		<div class="manage-table-wrapper">
			<table class="manage-table">
				<thead>
					<tr>
						<th style="width:80px;">图片</th>
						<th>商品</th>
						<th style="width:110px;">类别</th>
						<th style="width:150px;">价格</th>
						<th style="width:130px;">库存</th>
						<th style="width:110px;">状态</th>
						<th style="width:230px;">操作</th>
					</tr>
				</thead>
				<tbody>
					${products.map(p => {
						const stock = Number(p.stock || 0);
						const saleStatus = stock <= 0 ? '停止销售' : stock <= 10 ? '库存偏低' : '销售中';
						const statusColor = stock <= 0 ? '#ef4444' : stock <= 10 ? '#f59e0b' : '#10b981';
						return `
							<tr>
								<td data-label="图片">
									<img src="${p.image_url || 'https://via.placeholder.com/80'}" alt="${p.name}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">
								</td>
								<td data-label="商品">
									<div style="font-weight:600;">${p.name}</div>
									<div style="color:var(--color-text-muted);font-size:0.85rem;margin-top:4px;">${p.description ? (p.description.length > 50 ? p.description.substring(0, 50) + '...' : p.description) : '暂无描述'}</div>
								</td>
								<td data-label="类别">${p.category_name ? `<span style="background:rgba(30,144,255,0.15);color:#60a5fa;padding:3px 9px;border-radius:12px;font-size:0.8rem;">${p.category_name}</span>` : '-'}</td>
								<td data-label="价格"><input class="quick-price" data-id="${p.id}" type="number" min="0.01" step="0.01" value="${p.price}" style="width:120px;margin:0;padding:9px 10px;"></td>
								<td data-label="库存"><input class="quick-stock" data-id="${p.id}" type="number" min="0" step="1" value="${stock}" style="width:100px;margin:0;padding:9px 10px;"></td>
								<td data-label="状态"><span style="color:${statusColor};font-weight:600;">${saleStatus}</span></td>
								<td data-label="操作">
									<div style="display:flex;gap:8px;flex-wrap:wrap;">
										<button class="btn-manage btn-quick-save" data-id="${p.id}">保存价格/库存</button>
										<button class="btn-manage btn-edit" data-id="${p.id}">编辑</button>
										<button class="btn-manage btn-delete" data-id="${p.id}">删除</button>
									</div>
								</td>
							</tr>
						`;
					}).join('')}
				</tbody>
			</table>
		</div>
	`;

	document.querySelectorAll('.btn-quick-save').forEach(btn => {
		btn.onclick = async () => {
			const id = btn.dataset.id;
			const price = parseFloat(document.querySelector(`.quick-price[data-id="${id}"]`).value);
			const stock = parseInt(document.querySelector(`.quick-stock[data-id="${id}"]`).value, 10);
			if (!price || price <= 0 || Number.isNaN(stock) || stock < 0) {
				window.utils.showToast('价格必须大于0，库存不能小于0');
				return;
			}
			const result = await window.api.updateProduct(id, { price, stock });
			if (result.message === '商品更新成功') {
				window.utils.showToast('价格和库存已更新');
				await loadMyProducts();
			} else {
				window.utils.showToast('更新失败：' + (result.message || ''));
			}
		};
	});
	document.querySelectorAll('.btn-edit').forEach(btn => btn.onclick = () => showEditModal(btn.dataset.id));
	document.querySelectorAll('.btn-delete').forEach(btn => btn.onclick = () => deleteProduct(btn.dataset.id));
}

async function loadCategoriesTab(container) {
	container.innerHTML = `
		<div class="glass-card" style="padding:30px;">
			<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap;">
				<h3 style="font-size:1.2rem;">商品目录管理</h3>
				<button id="btn-add-category" class="neon-btn" style="font-size:0.9rem;">+ 添加类别</button>
			</div>
			<div id="add-category-form" style="display:none;margin-bottom:20px;padding:20px;background:rgba(148,163,184,0.05);border-radius:12px;">
				<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">
					<div style="flex:1;min-width:180px;">
						<label style="display:block;margin-bottom:4px;font-size:0.85rem;color:var(--color-text-muted);">类别名称</label>
						<input id="new-cat-name" class="form-input-modern" style="width:100%;margin:0;" placeholder="如：数码配件">
					</div>
					<div style="flex:2;min-width:220px;">
						<label style="display:block;margin-bottom:4px;font-size:0.85rem;color:var(--color-text-muted);">描述</label>
						<input id="new-cat-desc" class="form-input-modern" style="width:100%;margin:0;" placeholder="类别描述（可选）">
					</div>
					<button id="btn-save-category" class="neon-btn" style="font-size:0.9rem;">保存</button>
					<button id="btn-cancel-category" class="neon-btn" style="background:rgba(148,163,184,0.2);font-size:0.9rem;">取消</button>
				</div>
				<div id="cat-form-error" style="color:var(--color-accent);margin-top:8px;font-size:0.85rem;"></div>
			</div>
			<div id="categories-table-container">加载中...</div>
		</div>
	`;

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
		if (!name) {
			errEl.textContent = '请输入类别名称';
			return;
		}
		const result = await window.api.createCategory(name, desc);
		if (result.message === '类别创建成功' || result.message === '类别添加成功') {
			window.utils.showToast('类别创建成功');
			document.getElementById('add-category-form').style.display = 'none';
			document.getElementById('new-cat-name').value = '';
			document.getElementById('new-cat-desc').value = '';
			await loadCategoriesTable(document.getElementById('categories-table-container'));
			if (window.sell && window.sell.loadCategories) window.sell.loadCategories();
		} else {
			errEl.textContent = result.message || '创建失败';
		}
	};

	await loadCategoriesTable(document.getElementById('categories-table-container'));
}

async function loadCategoriesTable(container) {
	const categories = await window.api.fetchCategories();
	if (categories.length === 0) {
		container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无类别</div>';
		return;
	}
	container.innerHTML = `
		<div class="manage-table-wrapper">
			<table class="manage-table">
				<thead><tr><th>ID</th><th>名称</th><th>描述</th><th>创建时间</th><th style="width:180px;">操作</th></tr></thead>
				<tbody>
					${categories.map(c => `
						<tr>
							<td data-label="ID">#${c.id}</td>
							<td data-label="名称"><input class="cat-name" data-id="${c.id}" value="${c.name}" style="width:180px;margin:0;padding:9px 10px;"></td>
							<td data-label="描述"><input class="cat-desc" data-id="${c.id}" value="${c.description || ''}" style="width:100%;min-width:220px;margin:0;padding:9px 10px;"></td>
							<td data-label="创建时间" style="color:var(--color-text-muted);font-size:0.85rem;">${c.created_at ? new Date(c.created_at).toLocaleDateString('zh-CN') : '-'}</td>
							<td data-label="操作">
								<div style="display:flex;gap:8px;flex-wrap:wrap;">
									<button class="btn-manage btn-save-category-row" data-id="${c.id}">保存</button>
									<button class="btn-manage btn-delete" data-id="${c.id}">删除</button>
								</div>
							</td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		</div>
	`;

	container.querySelectorAll('.btn-save-category-row').forEach(btn => {
		btn.onclick = async () => {
			const id = btn.dataset.id;
			const name = container.querySelector(`.cat-name[data-id="${id}"]`).value.trim();
			const desc = container.querySelector(`.cat-desc[data-id="${id}"]`).value.trim();
			if (!name) {
				window.utils.showToast('类别名称不能为空');
				return;
			}
			const res = await window.api.updateCategory(id, name, desc);
			if (res.message === '类别更新成功') {
				window.utils.showToast('类别已更新');
				await loadCategoriesTable(container);
			} else {
				window.utils.showToast('更新失败：' + (res.message || ''));
			}
		};
	});
	container.querySelectorAll('.btn-delete').forEach(btn => {
		btn.onclick = async () => {
			if (!confirm('确定删除该类别？已被商品使用的类别不能删除。')) return;
			const res = await window.api.deleteCategory(btn.dataset.id);
			if (res.message === '类别删除成功') {
				window.utils.showToast('类别已删除');
				await loadCategoriesTable(container);
			} else {
				window.utils.showToast('删除失败：' + (res.message || ''));
			}
		};
	});
}

async function loadSalesStatusTab(container) {
	const [stats, products, orders] = await Promise.all([
		window.api.fetchSalesStatistics('month'),
		window.api.fetchMyProducts(),
		window.api.fetchSellerOrders()
	]);
	const summary = stats.summary || {};
	const statusBreakdown = stats.statusBreakdown || [];
	const lowStock = (products.products || []).filter(p => Number(p.stock || 0) <= 10);
	const activeOrders = (orders || []).filter(o => ['待支付', '已支付', '已发货'].includes(o.status));
	const maxStatusCount = Math.max(...statusBreakdown.map(s => Number(s.count || 0)), 1);

	container.innerHTML = `
		<div class="stats-cards">
			<div class="stat-card"><div class="stat-icon">💰</div><div class="stat-info"><div class="stat-label">总销售额</div><div class="stat-value">${formatCurrency(summary.total_sales)}</div></div></div>
			<div class="stat-card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-label">订单数</div><div class="stat-value">${summary.total_orders || 0}</div></div></div>
			<div class="stat-card"><div class="stat-icon">🧾</div><div class="stat-info"><div class="stat-label">售出件数</div><div class="stat-value">${summary.total_items_sold || 0}</div></div></div>
			<div class="stat-card"><div class="stat-icon">⚠️</div><div class="stat-info"><div class="stat-label">低库存商品</div><div class="stat-value">${lowStock.length}</div></div></div>
		</div>

		<div class="stats-section">
			<h3 class="section-title">订单状态监控</h3>
			${statusBreakdown.length === 0 ? '<p style="color:var(--color-text-muted);">暂无订单状态数据</p>' : `
				<div class="status-breakdown">
					${statusBreakdown.map(s => `
						<div class="status-item">
							<div class="status-label">${s.status || '未知'}</div>
							<div class="status-bar"><div class="status-bar-fill" style="width:${Math.max((Number(s.count || 0) / maxStatusCount) * 100, 4)}%;background:${getStatusColor(s.status)};"></div></div>
							<div class="status-count">${s.count || 0} 单 / ${formatCurrency(s.amount)}</div>
						</div>
					`).join('')}
				</div>
			`}
		</div>

		<div class="stats-section">
			<h3 class="section-title">待处理订单</h3>
			${activeOrders.length === 0 ? '<p style="color:var(--color-text-muted);">暂无待处理订单</p>' : `
				<div class="manage-table-wrapper" style="padding:0;background:transparent;border:none;">
					<table class="manage-table">
						<thead><tr><th>订单</th><th>买家</th><th>状态</th><th>金额</th><th>时间</th><th>商品</th></tr></thead>
						<tbody>
							${activeOrders.slice(0, 10).map(o => `
								<tr>
									<td data-label="订单">#${o.id}</td>
									<td data-label="买家">${o.buyer_name || '-'}</td>
									<td data-label="状态"><span style="color:${getStatusColor(o.status)};font-weight:600;">${o.status || '-'}</span></td>
									<td data-label="金额">${formatCurrency(o.total_price)}</td>
									<td data-label="时间" style="font-size:0.85rem;color:var(--color-text-muted);">${formatDateTime(o.created_at)}</td>
									<td data-label="商品">${(o.items || []).map(i => `${i.name || i.product_name} x${i.quantity}`).join('、') || '-'}</td>
								</tr>
							`).join('')}
						</tbody>
					</table>
				</div>
			`}
		</div>

		<div class="stats-section">
			<h3 class="section-title">库存预警</h3>
			${lowStock.length === 0 ? '<p style="color:var(--color-text-muted);">库存状态正常</p>' : `
				<div class="manage-table-wrapper" style="padding:0;background:transparent;border:none;">
					<table class="manage-table">
						<thead><tr><th>商品</th><th>类别</th><th>库存</th><th>价格</th><th>操作</th></tr></thead>
						<tbody>
							${lowStock.map(p => `
								<tr>
									<td data-label="商品">${p.name}</td>
									<td data-label="类别">${p.category_name || '-'}</td>
									<td data-label="库存"><span class="stock-badge ${Number(p.stock || 0) > 0 ? 'stock-low' : 'stock-out'}">${p.stock || 0}</span></td>
									<td data-label="价格">${formatCurrency(p.price)}</td>
									<td data-label="操作"><button class="btn-manage btn-edit" data-id="${p.id}">调整库存</button></td>
								</tr>
							`).join('')}
						</tbody>
					</table>
				</div>
			`}
		</div>
	`;
	container.querySelectorAll('.btn-edit').forEach(btn => btn.onclick = () => showEditModal(btn.dataset.id));
}

async function loadBrowseLogsTab(container) {
	let page = 1;
	const limit = 15;
	async function render() {
		const data = await window.api.fetchBrowseLogs({ page, limit });
		const logs = data.logs || [];
		const total = data.total || 0;
		const totalPages = Math.max(Math.ceil(total / limit), 1);
		container.innerHTML = `
			<div class="glass-card" style="padding:20px;">
				<h3 style="margin-bottom:16px;font-size:1.15rem;">用户浏览日志 <span style="font-size:0.85rem;color:var(--color-text-muted);">共 ${total} 条</span></h3>
				<div class="manage-table-wrapper">
					<table class="manage-table">
						<thead><tr><th>用户</th><th>商品</th><th>类别</th><th>开始时间</th><th>停留</th><th>IP</th></tr></thead>
						<tbody>
							${logs.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无浏览记录</td></tr>' : logs.map(log => `
								<tr>
									<td data-label="用户">${log.username || '游客'}</td>
									<td data-label="商品">${log.product_name || '-'}</td>
									<td data-label="类别">${log.category_name || '-'}</td>
									<td data-label="开始时间" style="font-size:0.85rem;">${formatDateTime(log.start_time)}</td>
									<td data-label="停留">${log.duration_seconds || 0}s</td>
									<td data-label="IP" style="font-size:0.8rem;color:var(--color-text-muted);">${log.ip_address || '-'}</td>
								</tr>
							`).join('')}
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
		document.getElementById('browse-prev').onclick = () => { if (page > 1) { page--; render(); } };
		document.getElementById('browse-next').onclick = () => { if (page < totalPages) { page++; render(); } };
	}
	await render();
}

async function loadPurchaseLogsTab(container) {
	let page = 1;
	const limit = 10;
	let statusFilter = '';
	async function render() {
		const data = await window.api.fetchPurchaseLogs({ page, limit, status: statusFilter });
		const logs = data.logs || [];
		const total = data.total || 0;
		const totalPages = Math.max(Math.ceil(total / limit), 1);
		container.innerHTML = `
			<div class="glass-card" style="padding:20px;">
				<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:10px;flex-wrap:wrap;">
					<h3 style="font-size:1.15rem;">用户购买日志 <span style="font-size:0.85rem;color:var(--color-text-muted);">共 ${total} 条</span></h3>
					<select id="purchase-status-filter" class="filter-select">
						<option value="">全部状态</option>
						${['待支付', '已支付', '已发货', '已完成', '已取消'].map(s => `<option value="${s}" ${statusFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
					</select>
				</div>
				${logs.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--color-text-muted);">暂无购买记录</div>' : logs.map(order => `
					<div class="order-card">
						<div class="order-header">
							<div class="order-info-row">
								<div><span class="order-id">订单 #${order.id}</span><span style="margin-left:10px;color:var(--color-text-muted);">${order.buyer_name || '-'}</span></div>
								<span style="padding:3px 10px;border-radius:20px;font-size:0.8rem;background:${getStatusColor(order.status)}22;color:${getStatusColor(order.status)};border:1px solid ${getStatusColor(order.status)}44;">${order.status || '-'}</span>
							</div>
						</div>
						<div class="order-items">
							${(order.items || []).map(i => `
								<div class="order-item-row">
									<img src="${i.image_url || 'https://via.placeholder.com/50'}" class="item-thumb" alt="">
									<div class="item-details"><div class="item-name">${i.product_name || i.name || '商品'}</div><div class="item-price">单价 ${formatCurrency(i.price)} x ${i.quantity}</div></div>
									<div class="item-total">${formatCurrency(Number(i.price || 0) * Number(i.quantity || 0))}</div>
								</div>
							`).join('')}
						</div>
						<div class="order-footer">
							<div style="color:var(--color-text-muted);font-size:0.85rem;">创建时间：${formatDateTime(order.created_at)}${order.payment_time ? ` | 支付时间：${formatDateTime(order.payment_time)}` : ''}</div>
							<div class="order-total">订单金额：<strong>${formatCurrency(order.total_price)}</strong></div>
						</div>
					</div>
				`).join('')}
				<div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-top:16px;">
					<button id="purchase-prev" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page <= 1 ? 'disabled' : ''}>上一页</button>
					<span style="color:var(--color-text-muted);font-size:0.9rem;">第 ${page} / ${totalPages} 页</span>
					<button id="purchase-next" class="neon-btn" style="font-size:0.85rem;padding:6px 16px;" ${page >= totalPages ? 'disabled' : ''}>下一页</button>
				</div>
			</div>
		`;
		document.getElementById('purchase-status-filter').onchange = function() {
			statusFilter = this.value;
			page = 1;
			render();
		};
		document.getElementById('purchase-prev').onclick = () => { if (page > 1) { page--; render(); } };
		document.getElementById('purchase-next').onclick = () => { if (page < totalPages) { page++; render(); } };
	}
	await render();
}

async function showEditModal(productId) {
	try {
		const product = await window.api.fetchProductDetail(productId);
		const editModal = document.getElementById('edit-product-modal');

		document.getElementById('edit-product-id').value = product.id;
		document.getElementById('edit-name').value = product.name;
		document.getElementById('edit-description').value = product.description || '';
		document.getElementById('edit-price').value = product.price;
		document.getElementById('edit-stock').value = product.stock;

		const categories = await window.api.fetchCategories().catch(() => []);
		const editSelect = document.getElementById('edit-category');
		editSelect.innerHTML = '<option value="">选择商品类别（可选）</option>' +
			categories.map(c => `<option value="${c.id}" ${product.category_id == c.id ? 'selected' : ''}>${c.name}</option>`).join('');

		document.getElementById('edit-error').textContent = '';
		document.getElementById('edit-success').style.display = 'none';
		editImageFile = null;
		document.getElementById('edit-image-preview').innerHTML = product.image_url ? `
			<div style="text-align:center;">
				<img src="${product.image_url}" alt="当前图片" style="max-width:100%;max-height:200px;border-radius:12px;border:1px solid rgba(148,163,184,0.2);">
				<div style="color:#94a3b8;font-size:0.85rem;margin-top:8px;">当前图片（不更换请留空）</div>
			</div>
		` : '';
		editModal.style.display = 'block';
	} catch (err) {
		window.utils.showToast('获取商品信息失败：' + err.message);
	}
}

function initEditModal() {
	const editModal = document.getElementById('edit-product-modal');
	const closeBtn = document.getElementById('close-edit-product');
	const editForm = document.getElementById('edit-product-form');
	const editUploadArea = document.getElementById('edit-upload-area');
	const editImageInput = document.getElementById('edit-image');

	closeBtn.onclick = () => closeEditModal();
	editUploadArea.onclick = () => editImageInput.click();

	editImageInput.onchange = (e) => {
		const file = e.target.files[0];
		if (!file) return;
		if (file.size > 5 * 1024 * 1024) {
			window.utils.showToast('图片大小不能超过5MB');
			return;
		}
		const reader = new FileReader();
		reader.onload = (event) => {
			document.getElementById('edit-image-preview').innerHTML = `
				<div style="text-align:center;">
					<img src="${event.target.result}" alt="新图片预览" style="max-width:100%;max-height:200px;border-radius:12px;border:1px solid rgba(148,163,184,0.2);">
					<div style="color:#10b981;font-size:0.85rem;margin-top:8px;">✓ 新图片（${file.name}）</div>
				</div>
			`;
		};
		reader.readAsDataURL(file);
		editImageFile = file;
	};

	editUploadArea.ondragover = (e) => {
		e.preventDefault();
		editUploadArea.style.borderColor = '#1e90ff';
	};
	editUploadArea.ondragleave = () => {
		editUploadArea.style.borderColor = 'rgba(148, 163, 184, 0.2)';
	};
	editUploadArea.ondrop = (e) => {
		e.preventDefault();
		editUploadArea.style.borderColor = 'rgba(148, 163, 184, 0.2)';
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('image/')) {
			editImageInput.files = e.dataTransfer.files;
			editImageInput.dispatchEvent(new Event('change'));
		}
	};

	editForm.onsubmit = async (e) => {
		e.preventDefault();
		const editError = document.getElementById('edit-error');
		const editSuccess = document.getElementById('edit-success');
		editError.textContent = '';
		editSuccess.style.display = 'none';

		const productId = document.getElementById('edit-product-id').value;
		const name = document.getElementById('edit-name').value.trim();
		const description = document.getElementById('edit-description').value.trim();
		const price = parseFloat(document.getElementById('edit-price').value);
		const stock = parseInt(document.getElementById('edit-stock').value, 10);
		if (!name || !price || price <= 0 || Number.isNaN(stock) || stock < 0) {
			editError.textContent = '请填写有效的商品名称、价格和库存';
			return;
		}

		const submitBtn = e.target.querySelector('button[type="submit"]');
		submitBtn.disabled = true;
		submitBtn.textContent = '保存中...';
		try {
			const updateData = {
				name,
				description,
				price,
				stock,
				category_id: document.getElementById('edit-category').value || null
			};
			if (editImageFile) {
				editSuccess.textContent = '正在上传图片...';
				editSuccess.style.display = 'block';
				const uploadData = await window.api.uploadImage(editImageFile, 'products');
				if (!uploadData.success) throw new Error(uploadData.message || '图片上传失败');
				updateData.image_url = uploadData.url;
			}
			const result = await window.api.updateProduct(productId, updateData);
			if (result.message === '商品更新成功') {
				editSuccess.textContent = '✓ 商品更新成功！';
				window.utils.showToast('商品更新成功');
				setTimeout(() => {
					closeEditModal();
					loadWorkbenchTab('products');
				}, 700);
			} else {
				throw new Error(result.message || '更新失败');
			}
		} catch (error) {
			editError.textContent = error.message;
			window.utils.showToast('更新失败：' + error.message);
		} finally {
			submitBtn.disabled = false;
			submitBtn.textContent = '保存修改';
		}
	};

	window.addEventListener('click', event => {
		if (event.target === editModal) closeEditModal();
	});
}

function closeEditModal() {
	const editModal = document.getElementById('edit-product-modal');
	const editForm = document.getElementById('edit-product-form');
	editModal.style.display = 'none';
	editForm.reset();
	editImageFile = null;
	document.getElementById('edit-image-preview').innerHTML = '';
	document.getElementById('edit-error').textContent = '';
	document.getElementById('edit-success').style.display = 'none';
}

async function deleteProduct(productId) {
	if (!confirm('确定要删除这个商品吗？此操作不可恢复。已有订单的商品无法删除，建议将库存设为0。')) return;
	const result = await window.api.deleteProduct(productId);
	if (result.message === '商品删除成功') {
		window.utils.showToast('商品删除成功');
		await loadMyProducts();
	} else {
		window.utils.showToast('删除失败：' + (result.message || ''));
	}
}

document.addEventListener('DOMContentLoaded', () => {
	initEditModal();
});

window.productManage = {
	showMyProducts,
	loadMyProducts
};
console.log('✅ window.productManage 已导出:', window.productManage);
