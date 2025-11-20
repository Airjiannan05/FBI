// ========== 销售统计模块 ========== //

// 显示销售统计页面
async function showSalesStatistics() {
	console.log('📊 调用 showSalesStatistics() - 显示销售统计页面');
	const main = document.getElementById('main-content');
	
	// 检查登录状态
	const user = window.auth.getCurrentUser();
	if (!user) {
		window.utils.showToast('请先登录');
		return;
	}
	
	main.innerHTML = `
		<div class="container">
			<div style="text-align: center; margin-bottom: 30px;">
				<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 10px;" class="gradient-text">📊 销售统计</h2>
				<p style="color: var(--color-text-muted); font-size: 1rem;">查看销售数据和订单管理</p>
			</div>
			
			<!-- 标签页切换 -->
			<div class="sales-tabs">
				<button class="sales-tab active" data-tab="overview">数据概览</button>
				<button class="sales-tab" data-tab="orders">订单管理</button>
				<button class="sales-tab" data-tab="products">商品销售</button>
			</div>
			
			<!-- 标签页内容 -->
			<div id="sales-content" style="margin-top: 30px;">
				<div class="loading-spinner">加载中...</div>
			</div>
		</div>
	`;
	
	// 标签页切换事件
	document.querySelectorAll('.sales-tab').forEach(tab => {
		tab.onclick = () => {
			document.querySelectorAll('.sales-tab').forEach(t => t.classList.remove('active'));
			tab.classList.add('active');
			const tabName = tab.dataset.tab;
			switch(tabName) {
				case 'overview':
					loadOverviewTab();
					break;
				case 'orders':
					loadOrdersTab();
					break;
				case 'products':
					loadProductsTab();
					break;
			}
		};
	});
	
	// 默认加载概览标签
	await loadOverviewTab();
}

// 加载数据概览标签
async function loadOverviewTab() {
	const content = document.getElementById('sales-content');
	content.innerHTML = '<div class="loading-spinner">加载中...</div>';
	
	try {
		const stats = await window.api.fetchSalesStatistics('month');
		
		content.innerHTML = `
			<!-- 统计卡片 -->
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
			
			<!-- 订单状态分布 -->
			<div class="stats-section">
				<h3 class="section-title">订单状态分布</h3>
				<div class="status-breakdown">
					${stats.statusBreakdown.map(s => `
						<div class="status-item">
							<div class="status-label">${s.status}</div>
							<div class="status-bar">
								<div class="status-bar-fill" style="width: ${(s.count / stats.summary.total_orders * 100).toFixed(0)}%"></div>
							</div>
							<div class="status-count">${s.count} 单 (￥${parseFloat(s.amount).toFixed(2)})</div>
						</div>
					`).join('')}
				</div>
			</div>
			
			<!-- 销售趋势图 -->
			<div class="stats-section">
				<h3 class="section-title">销售趋势（最近30天）</h3>
				<div class="trend-chart">
					${stats.trend.length > 0 ? renderTrendChart(stats.trend) : '<p style="text-align: center; color: var(--color-text-muted);">暂无数据</p>'}
				</div>
			</div>
			
			<!-- 热销商品Top 10 -->
			<div class="stats-section">
				<h3 class="section-title">🔥 热销商品 Top 10</h3>
				<div class="top-products">
					${stats.topProducts.length > 0 ? stats.topProducts.map((p, index) => `
						<div class="top-product-item">
							<div class="product-rank">${index + 1}</div>
							<img src="${p.image_url || 'https://via.placeholder.com/60'}" alt="${p.name}" class="product-thumb">
							<div class="product-details">
								<div class="product-name">${p.name}</div>
								<div class="product-stats">销量: ${p.sold_count} | 销售额: ￥${parseFloat(p.sales_amount).toFixed(2)}</div>
							</div>
						</div>
					`).join('') : '<p style="text-align: center; color: var(--color-text-muted);">暂无数据</p>'}
				</div>
			</div>
		`;
	} catch (err) {
		content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
	}
}

// 渲染趋势图（简单的条形图）
function renderTrendChart(data) {
	if (data.length === 0) return '<p style="text-align: center; color: var(--color-text-muted);">暂无数据</p>';
	
	const maxAmount = Math.max(...data.map(d => parseFloat(d.sales_amount)));
	
	return `
		<div class="chart-container">
			${data.map(d => `
				<div class="chart-bar-group">
					<div class="chart-label">${d.date}</div>
					<div class="chart-bar">
						<div class="chart-bar-fill" style="width: ${(d.sales_amount / maxAmount * 100).toFixed(0)}%">
							<span class="chart-value">￥${parseFloat(d.sales_amount).toFixed(0)}</span>
						</div>
					</div>
					<div class="chart-count">${d.order_count}单</div>
				</div>
			`).join('')}
		</div>
	`;
}

// 加载订单管理标签
async function loadOrdersTab(filterStatus = '', filterStartDate = '', filterEndDate = '') {
	const content = document.getElementById('sales-content');
	content.innerHTML = '<div class="loading-spinner">加载中...</div>';
	
	try {
		console.log('📦 加载订单管理 - 筛选条件:', { filterStatus, filterStartDate, filterEndDate });
		const orders = await window.api.fetchSellerOrders(filterStatus, filterStartDate, filterEndDate);
		console.log('📦 获取到订单数量:', orders.length);
		
		content.innerHTML = `
			<!-- 订单筛选 -->
			<div class="order-filters">
				<select id="status-filter" class="filter-select">
					<option value="" ${!filterStatus ? 'selected' : ''}>全部状态</option>
					<option value="待支付" ${filterStatus === '待支付' ? 'selected' : ''}>待支付</option>
					<option value="已支付" ${filterStatus === '已支付' ? 'selected' : ''}>已支付</option>
					<option value="已发货" ${filterStatus === '已发货' ? 'selected' : ''}>已发货</option>
					<option value="已完成" ${filterStatus === '已完成' ? 'selected' : ''}>已完成</option>
					<option value="已取消" ${filterStatus === '已取消' ? 'selected' : ''}>已取消</option>
				</select>
				<input type="date" id="start-date" class="filter-input" placeholder="开始日期" value="${filterStartDate}">
				<input type="date" id="end-date" class="filter-input" placeholder="结束日期" value="${filterEndDate}">
				<button id="apply-filter" class="neon-btn btn-small">筛选</button>
				<button id="reset-filter" class="neon-btn btn-small" style="background: rgba(148, 163, 184, 0.2);">重置</button>
			</div>
			
			<!-- 订单列表 -->
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
									${o.status === '已支付' ? `
										<button class="btn-ship neon-btn btn-small" data-id="${o.id}">安排发货</button>
									` : ''}
									${o.tracking_number ? `
										<span class="tracking-info">快递: ${o.carrier || ''} ${o.tracking_number}</span>
									` : ''}
								</div>
							</div>
						</div>
					`).join('')
				}
			</div>
		`;
		
		// 筛选按钮事件
		document.getElementById('apply-filter')?.addEventListener('click', async () => {
			const status = document.getElementById('status-filter').value;
			const startDate = document.getElementById('start-date').value;
			const endDate = document.getElementById('end-date').value;
			// 带参数重新加载订单列表
			await loadOrdersTab(status, startDate, endDate);
		});
		
		document.getElementById('reset-filter')?.addEventListener('click', () => {
			// 清空筛选条件,重新加载
			loadOrdersTab();
		});
		
		// 发货按钮事件
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
					`<table class="sales-table">
						<thead>
							<tr>
								<th>排名</th>
								<th>商品</th>
								<th>销量</th>
								<th>销售额</th>
								<th>单价</th>
							</tr>
						</thead>
						<tbody>
							${stats.topProducts.map((p, index) => `
								<tr>
									<td><span class="rank-badge rank-${index < 3 ? index + 1 : ''}">${index + 1}</span></td>
									<td>
										<div style="display: flex; align-items: center; gap: 10px;">
											<img src="${p.image_url || 'https://via.placeholder.com/50'}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;">
											<span>${p.name}</span>
										</div>
									</td>
									<td><strong>${p.sold_count}</strong> 件</td>
									<td><span style="color: var(--color-primary); font-weight: 600;">￥${parseFloat(p.sales_amount).toFixed(2)}</span></td>
									<td>￥${p.price}</td>
								</tr>
							`).join('')}
						</tbody>
					</table>`
				}
			</div>
		`;
	} catch (err) {
		content.innerHTML = `<div style="text-align: center; color: var(--color-accent);">加载失败: ${err.message}</div>`;
	}
}

// 导出销售统计函数
window.sales = {
	showSalesStatistics
};
