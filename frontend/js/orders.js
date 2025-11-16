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
							<div style="display: flex; gap: 10px;">
								<button data-id="${o.id}" class="btn-view-order neon-btn btn-small">查看详情</button>
								${o.status === '待支付' ? `
									<button data-id="${o.id}" data-price="${o.total_price}" class="btn-pay-now neon-btn btn-small" style="background: linear-gradient(135deg, #10b981, #3b82f6);">立即支付</button>
								` : ''}
							</div>
						</div>
					`).join('')}
				</div>
			`}
		</div>
	`;
	
	// 查看详情按钮
	document.querySelectorAll('.btn-view-order').forEach(btn => {
		btn.onclick = () => {
			showOrderDetail(btn.dataset.id);
		};
	});
	
	// 立即支付按钮
	document.querySelectorAll('.btn-pay-now').forEach(btn => {
		btn.onclick = async () => {
			const orderId = btn.dataset.id;
			const price = btn.dataset.price;
			
			// 确认支付
			if (!confirm(`确认支付 ￥${price} 吗？`)) {
				return;
			}
			
			// 禁用按钮
			btn.disabled = true;
			btn.textContent = '支付中...';
			
			try {
				// 调用支付接口
				const res = await window.api.payOrder(orderId, 'alipay');
				if (res.order_id) {
					window.utils.showToast('✓ 支付成功！订单确认邮件已发送');
					// 刷新订单列表
					setTimeout(() => {
						showOrders();
					}, 1500);
				} else {
					window.utils.showToast('✗ ' + (res.message || '支付失败'));
					btn.disabled = false;
					btn.textContent = '立即支付';
				}
			} catch (err) {
				window.utils.showToast('✗ 支付处理失败，请重试');
				btn.disabled = false;
				btn.textContent = '立即支付';
			}
		};
	});
}

// 显示订单详情页
async function showOrderDetail(id) {
	const main = document.getElementById('main-content');
	const detail = await window.api.fetchOrderDetail(id);
	const order = detail.order;
	
	// 支付时间显示
	const paymentTimeHtml = order.payment_time ? `
		<div class="detail-row">
			<span class="detail-label">支付时间:</span>
			<span class="detail-value">${new Date(order.payment_time).toLocaleString('zh-CN')}</span>
		</div>
	` : '';
	
	// 支付方式显示
	const paymentMethodHtml = order.payment_method ? `
		<div class="detail-row">
			<span class="detail-label">支付方式:</span>
			<span class="detail-value">${getPaymentMethodText(order.payment_method)}</span>
		</div>
	` : '';
	
	// 物流信息显示
	const shippingInfoHtml = order.status === '已发货' || order.status === '已完成' ? `
		<div class="order-detail-shipping" style="background: rgba(16, 185, 129, 0.1); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #10b981;">
			<h3 style="color: #10b981; margin-bottom: 15px;">📦 物流信息</h3>
			<div class="detail-row" style="margin-bottom: 10px;">
				<span class="detail-label">物流公司:</span>
				<span class="detail-value">${order.carrier || '顺丰速运'}</span>
			</div>
			<div class="detail-row" style="margin-bottom: 10px;">
				<span class="detail-label">运单号:</span>
				<span class="detail-value" style="color: #1e90ff; font-family: monospace; font-weight: 600;">${order.tracking_number || '暂无'}</span>
			</div>
			${order.shipped_at ? `
				<div class="detail-row">
					<span class="detail-label">发货时间:</span>
					<span class="detail-value">${new Date(order.shipped_at).toLocaleString('zh-CN')}</span>
				</div>
			` : ''}
		</div>
	` : '';
	
	main.innerHTML = `
		<div class="container">
			<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 30px;" class="gradient-text">订单详情</h2>
			<div class="order-detail-card">
				<div class="order-detail-header">
					<div class="detail-row">
						<span class="detail-label">订单号:</span>
						<span class="detail-value">#${order.id}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">下单时间:</span>
						<span class="detail-value">${new Date(order.created_at).toLocaleString('zh-CN')}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">订单状态:</span>
						<span class="detail-value">
							<span class="order-status status-${order.status}">${window.utils.getStatusText(order.status)}</span>
						</span>
					</div>
					${paymentTimeHtml}
					${paymentMethodHtml}
				</div>
				
				${shippingInfoHtml}
				
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
					<span class="total-amount">￥${order.total_price}</span>
				</div>
				<div style="display: flex; gap: 15px; margin-top: 20px; flex-wrap: wrap;">
					<button class="neon-btn" onclick="window.orders.showOrders()">← 返回订单列表</button>
					${order.status === '待支付' ? `
						<button class="neon-btn" id="btn-pay-order" style="background: linear-gradient(135deg, #10b981, #3b82f6); flex: 1; min-width: 200px;">
							💳 立即支付
						</button>
					` : ''}
				</div>
			</div>
		</div>
	`;
	
	// 绑定支付按钮事件
	if (order.status === '待支付') {
		setTimeout(() => {
			const payBtn = document.getElementById('btn-pay-order');
			if (payBtn) {
				payBtn.onclick = async () => {
					// 确认支付
					if (!confirm(`确认支付 ￥${order.total_price} 吗？`)) {
						return;
					}
					
					// 禁用按钮
					payBtn.disabled = true;
					payBtn.textContent = '支付处理中...';
					
					try {
						// 调用支付接口（默认使用支付宝）
						const res = await window.api.payOrder(id, 'alipay');
						if (res.order_id) {
							window.utils.showToast('✓ 支付成功！订单确认邮件已发送');
							// 延迟后刷新订单详情
							setTimeout(() => {
								showOrderDetail(id);
							}, 1500);
						} else {
							window.utils.showToast('✗ ' + (res.message || '支付失败'));
							payBtn.disabled = false;
							payBtn.innerHTML = '💳 立即支付';
						}
					} catch (err) {
						window.utils.showToast('✗ 支付处理失败，请重试');
						payBtn.disabled = false;
						payBtn.innerHTML = '💳 立即支付';
					}
				};
			}
		}, 100);
	}
}

// 获取支付方式文本
function getPaymentMethodText(method) {
	const methodMap = {
		'alipay': '💙 支付宝',
		'wechat': '💚 微信支付',
		'card': '💳 银行卡'
	};
	return methodMap[method] || method;
}

// 导出订单函数
window.orders = {
	showOrders,
	showOrderDetail
};
