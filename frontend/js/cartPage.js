// ========== 购物车页面 ========== //

// 显示购物车页面
function showCart() {
	const main = document.getElementById('main-content');
	let cart = window.cart.getCart();
	let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
	main.innerHTML = `
		<div class="container">
			<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 30px;" class="gradient-text">购物车</h2>
			<div id="cart-list">
				${cart.length === 0 ? '<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">购物车为空</div>' : cart.map(item => `
					<div class="cart-item">
						<img src="${item.image_url || 'https://via.placeholder.com/80'}" class="cart-img">
						<div class="cart-item-info">
							<h3>${item.name}</h3>
							<p class="cart-item-price">￥${item.price}</p>
						</div>
						<div class="cart-item-quantity">数量: ${item.quantity}</div>
						<div class="cart-item-total">￥${(item.price * item.quantity).toFixed(2)}</div>
						<button data-id="${item.id}" class="btn-remove neon-btn btn-small">移除</button>
				</div>
			`).join('')}
			</div>
			${cart.length > 0 ? `
				<div class="cart-summary">
					<div class="cart-total">
						<span class="total-label">总计:</span>
						<span class="total-amount">￥${total.toFixed(2)}</span>
					</div>
					<button id="btn-checkout" class="neon-btn btn-large">
						<span>立即结算</span>
					</button>
				</div>
			` : ''}
		</div>
	`;
	
	document.querySelectorAll('.btn-remove').forEach(btn => {
		btn.onclick = () => {
			window.cart.removeFromCart(Number(btn.dataset.id));
			window.utils.showToast('✓ 已移除商品');
			showCart();
		};
	});
	
	if (cart.length > 0) {
		document.getElementById('btn-checkout').onclick = async () => {
			// 先创建订单
			const res = await window.api.createOrder(window.cart.getCart(), total);
			if (res.order_id) {
				window.cart.clearCart();
				window.utils.showToast('✓ 订单创建成功');
				// 跳转到支付页面
				setTimeout(() => {
					showPaymentModal(res.order_id, total);
				}, 500);
			} else {
				window.utils.showToast('✗ ' + (res.message || '下单失败'));
			}
		};
	}
}

// 显示支付弹窗
function showPaymentModal(orderId, totalPrice) {
	// 创建支付弹窗
	const modal = document.createElement('div');
	modal.className = 'modal';
	modal.innerHTML = `
		<div class="modal-content" style="max-width: 500px;">
			<span class="close" id="close-payment">&times;</span>
			<div class="qq-logo">💳</div>
			<h2 class="qq-title">订单支付</h2>
			<div style="background: rgba(15, 23, 42, 0.5); padding: 20px; border-radius: 12px; margin: 20px 0;">
				<div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
					<span style="color: var(--color-text-muted);">订单号：</span>
					<span style="color: var(--color-text); font-weight: 600;">#${orderId}</span>
				</div>
				<div style="display: flex; justify-content: space-between;">
					<span style="color: var(--color-text-muted);">应付金额：</span>
					<span style="color: var(--color-primary); font-size: 1.8rem; font-weight: 700;">￥${totalPrice.toFixed(2)}</span>
				</div>
			</div>
			<div style="margin: 30px 0;">
				<h3 style="color: var(--color-text); margin-bottom: 15px; font-size: 1.1rem;">选择支付方式</h3>
				<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
					<button class="payment-option neon-btn" data-method="alipay" style="padding: 20px; flex-direction: column; gap: 10px;">
						<span style="font-size: 2rem;">💙</span>
						<span>支付宝</span>
					</button>
					<button class="payment-option neon-btn" data-method="wechat" style="padding: 20px; flex-direction: column; gap: 10px;">
						<span style="font-size: 2rem;">💚</span>
						<span>微信支付</span>
					</button>
					<button class="payment-option neon-btn" data-method="card" style="padding: 20px; flex-direction: column; gap: 10px;">
						<span style="font-size: 2rem;">💳</span>
						<span>银行卡</span>
					</button>
				</div>
			</div>
			<div id="payment-error" style="color: var(--color-accent); text-align: center; min-height: 24px; margin-top: 15px;"></div>
		</div>
	`;
	
	document.body.appendChild(modal);
	
	// 关闭弹窗
	document.getElementById('close-payment').onclick = () => {
		document.body.removeChild(modal);
		window.orders.showOrders(); // 关闭后跳转到订单页
	};
	
	// 点击背景关闭
	modal.onclick = (e) => {
		if (e.target === modal) {
			document.body.removeChild(modal);
			window.orders.showOrders();
		}
	};
	
	// 支付方式选择
	document.querySelectorAll('.payment-option').forEach(btn => {
		btn.onclick = async () => {
			const method = btn.dataset.method;
			const methodName = btn.textContent.trim();
			
			// 禁用所有按钮
			document.querySelectorAll('.payment-option').forEach(b => b.disabled = true);
			
			// 模拟支付处理
			window.utils.showToast(`正在使用${methodName}支付...`);
			
			try {
				const res = await window.api.payOrder(orderId, method);
				if (res.order_id) {
					window.utils.showToast('✓ 支付成功！订单确认邮件已发送');
					document.body.removeChild(modal);
					setTimeout(() => {
						window.orders.showOrderDetail(orderId);
					}, 1500);
				} else {
					document.getElementById('payment-error').textContent = res.message || '支付失败';
					document.querySelectorAll('.payment-option').forEach(b => b.disabled = false);
				}
			} catch (err) {
				document.getElementById('payment-error').textContent = '支付处理失败，请重试';
				document.querySelectorAll('.payment-option').forEach(b => b.disabled = false);
			}
		};
	});
}

// 导出购物车页面函数
window.cartPage = {
	showCart
};
