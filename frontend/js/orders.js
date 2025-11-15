// ========== 订单页面 ========== //

// 显示订单列表页
async function showOrders() {
	const main = document.getElementById('main-content');
	const orders = await window.api.fetchOrders();
	main.innerHTML = `
		<div class="container">
			<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 30px;" class="gradient-text">我的订单</h2>
			${orders.length === 0 ? '<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">暂无订单</div>' : `
				<div id="order-list">
					${orders.map(o => `
						<div class="order-item">
							<div class="order-info">
								<div class="order-id">订单号: #${o.id}</div>
								<div class="order-time">${new Date(o.created_at).toLocaleString('zh-CN')}</div>
							</div>
							<div class="order-status status-${o.status}">${window.utils.getStatusText(o.status)}</div>
							<div class="order-price">￥${o.total_price}</div>
							<button data-id="${o.id}" class="neon-btn btn-small">查看详情</button>
						</div>
					`).join('')}
				</div>
			`}
		</div>
	`;
	
	document.querySelectorAll('.neon-btn').forEach(btn => {
		btn.onclick = async () => {
			showOrderDetail(btn.dataset.id);
		};
	});
}

// 显示订单详情页
async function showOrderDetail(id) {
	const main = document.getElementById('main-content');
	const detail = await window.api.fetchOrderDetail(id);
	main.innerHTML = `
		<div class="container">
			<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 30px;" class="gradient-text">订单详情</h2>
			<div class="order-detail-card">
				<div class="order-detail-header">
					<div class="detail-row">
						<span class="detail-label">订单号:</span>
						<span class="detail-value">#${detail.order.id}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">下单时间:</span>
						<span class="detail-value">${new Date(detail.order.created_at).toLocaleString('zh-CN')}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">订单状态:</span>
						<span class="detail-value status-${detail.order.status}">${window.utils.getStatusText(detail.order.status)}</span>
					</div>
				</div>
				<div class="order-detail-items">
					<h3>商品列表</h3>
					<ul class="order-items-list">
						${detail.items.map(i => `
							<li class="order-item-row">
								<span class="item-name">${i.name}</span>
								<span class="item-quantity">x ${i.quantity}</span>
								<span class="item-price">￥${i.price}</span>
							</li>
						`).join('')}
					</ul>
				</div>
				<div class="order-detail-total">
					<span class="total-label">总计:</span>
					<span class="total-amount">￥${detail.order.total_price}</span>
				</div>
				<button class="neon-btn" onclick="window.orders.showOrders()">← 返回订单列表</button>
			</div>
		</div>
	`;
}

// 导出订单函数
window.orders = {
	showOrders,
	showOrderDetail
};
