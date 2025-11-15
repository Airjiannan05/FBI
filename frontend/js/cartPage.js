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
			const res = await window.api.createOrder(window.cart.getCart(), total);
			if (res.order_id) {
				window.utils.showToast('✓ 下单成功，订单号：' + res.order_id);
				window.cart.clearCart();
				setTimeout(() => window.orders.showOrders(), 1500);
			} else {
				window.utils.showToast('✗ ' + (res.message || '下单失败'));
			}
		};
	}
}

// 导出购物车页面函数
window.cartPage = {
	showCart
};
