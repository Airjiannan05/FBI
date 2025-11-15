
// ========== 用户相关前端逻辑 ========== //

// ========== 工具函数 ========== //
function getStatusText(status) {
	const statusMap = {
		'pending': '待处理',
		'processing': '处理中',
		'shipped': '已发货',
		'delivered': '已送达',
		'cancelled': '已取消'
	};
	return statusMap[status] || status;
}

// ========== 商品相关API ========== //
async function fetchProducts() {
	const res = await fetch('/api/product');
	return (await res.json()).products || [];
}
async function fetchProductDetail(id) {
	const res = await fetch(`/api/product/${id}`);
	return (await res.json()).product;
}

// ========== 购物车本地存储 ========== //
function getCart() {
	return JSON.parse(localStorage.getItem('cart') || '[]');
}
function setCart(cart) {
	localStorage.setItem('cart', JSON.stringify(cart));
}
function addToCart(product, quantity = 1) {
	let cart = getCart();
	const idx = cart.findIndex(item => item.id === product.id);
	if (idx >= 0) {
		cart[idx].quantity += quantity;
	} else {
		cart.push({ ...product, quantity });
	}
	setCart(cart);
}
function removeFromCart(id) {
	let cart = getCart().filter(item => item.id !== id);
	setCart(cart);
}
function clearCart() {
	setCart([]);
}

// ========== 订单相关API ========== //
async function fetchOrders() {
	const user = JSON.parse(localStorage.getItem('user') || 'null');
	if (!user) return [];
	const res = await fetch(`/api/order?user_id=${user.id}`);
	return (await res.json()).orders || [];
}
async function fetchOrderDetail(id) {
	const res = await fetch(`/api/order/${id}`);
	return await res.json();
}
async function createOrder(items, total_price) {
	const user = JSON.parse(localStorage.getItem('user') || 'null');
	if (!user) return { message: '未登录' };
	const res = await fetch('/api/order', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			user_id: user.id,
			items: items.map(i => ({ product_id: i.id, quantity: i.quantity, price: i.price })),
			total_price
		})
	});
	return await res.json();
}

// 注册
async function registerUser(username, password, email) {
	const res = await fetch('/api/user/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password, email })
	});
	return res.json();
}

// 登录
async function loginUser(username, password) {
	const res = await fetch('/api/user/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});
	return res.json();
}

// 注销（前端只需清除token）
function logoutUser() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	alert('已注销');
	// 可刷新页面或跳转到首页
}

// 获取当前用户信息
async function getProfile() {
	const token = localStorage.getItem('token');
	if (!token) return null;
	const res = await fetch('/api/user/profile', {
		headers: { 'Authorization': 'Bearer ' + token }
	});
	return res.json();
}

// ========== UI交互 ========== //
document.addEventListener('DOMContentLoaded', () => {
	// 页面切换
	const main = document.getElementById('main-content');
	const heroSection = document.querySelector('.hero');
	
	document.getElementById('nav-home').onclick = () => {
		if (heroSection) heroSection.style.display = 'flex';
		showProductList();
	};
	document.getElementById('nav-products').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		showProductList();
	};
	document.getElementById('nav-cart').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		showCart();
	};
	document.getElementById('nav-orders').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		showOrders();
	};

	// 登录/注册/注销弹窗和按钮逻辑
	const loginModal = document.getElementById('login-modal');
	const registerModal = document.getElementById('register-modal');
	const loginForm = document.getElementById('login-form');
	const registerForm = document.getElementById('register-form');
	const loginError = document.getElementById('login-error');
	const registerError = document.getElementById('register-error');

	// 显示登录弹窗
	document.getElementById('nav-login').onclick = () => {
		loginModal.style.display = 'block';
		loginError.textContent = '';
	};
	// 显示注册弹窗
	document.getElementById('nav-register').onclick = () => {
		registerModal.style.display = 'block';
		registerError.textContent = '';
	};
	// 关闭弹窗
	document.getElementById('close-login').onclick = () => loginModal.style.display = 'none';
	document.getElementById('close-register').onclick = () => registerModal.style.display = 'none';

	// 登录表单提交
	loginForm.onsubmit = async (e) => {
		e.preventDefault();
		const username = document.getElementById('login-username').value.trim();
		const password = document.getElementById('login-password').value;
		if (!username || !password) {
			loginError.textContent = '请输入用户名和密码';
			return;
		}
		const data = await loginUser(username, password);
		if (data.token) {
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
			loginModal.style.display = 'none';
			loginForm.reset();
			updateNavAuth();
			alert('登录成功');
		} else {
			loginError.textContent = data.message || '登录失败';
		}
	};

	// 注册表单提交
	registerForm.onsubmit = async (e) => {
		e.preventDefault();
		const username = document.getElementById('register-username').value.trim();
		const password = document.getElementById('register-password').value;
		const email = document.getElementById('register-email').value.trim();
		if (!username || !password || !email) {
			registerError.textContent = '请填写所有字段';
			return;
		}
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
			registerError.textContent = '邮箱格式不正确';
			return;
		}
		if (password.length < 6) {
			registerError.textContent = '密码至少6位';
			return;
		}
		const data = await registerUser(username, password, email);
		if (data.message === '注册成功') {
			registerModal.style.display = 'none';
			registerForm.reset();
			alert('注册成功，请登录');
		} else {
			registerError.textContent = data.message || '注册失败';
		}
	};

	// 注销
	document.getElementById('nav-logout').onclick = () => {
		logoutUser();
		updateNavAuth();
	};

	// 点击弹窗外关闭
	window.onclick = function(event) {
		if (event.target === loginModal) loginModal.style.display = 'none';
		if (event.target === registerModal) registerModal.style.display = 'none';
	};

	// 登录状态切换导航栏
	function updateNavAuth() {
		if (localStorage.getItem('token')) {
			document.getElementById('nav-login').style.display = 'none';
			document.getElementById('nav-register').style.display = 'none';
			document.getElementById('nav-logout').style.display = '';
		} else {
			document.getElementById('nav-login').style.display = '';
			document.getElementById('nav-register').style.display = '';
			document.getElementById('nav-logout').style.display = 'none';
		}
	}
	updateNavAuth();

	// Hero区域"开始浏览"按钮点击事件
	const heroCta = document.querySelector('.hero-cta');
	if (heroCta) {
		heroCta.onclick = (e) => {
			e.preventDefault();
			// 隐藏Hero区域
			const heroSection = document.querySelector('.hero');
			if (heroSection) {
				heroSection.style.display = 'none';
			}
			// 显示商品列表
			showProductList();
			// 平滑滚动到内容区域
			document.getElementById('main-content').scrollIntoView({ behavior: 'smooth' });
		};
	}

	// 移动端汉堡菜单切换
	const navToggle = document.getElementById('nav-toggle');
	const mainNav = document.querySelector('.main-nav');
	if (navToggle && mainNav) {
		navToggle.onclick = () => {
			mainNav.classList.toggle('open');
		};
		// 点击导航链接后关闭菜单
		const navLinks = mainNav.querySelectorAll('.nav-link, .neon-btn');
		navLinks.forEach(link => {
			link.addEventListener('click', () => {
				mainNav.classList.remove('open');
			});
		});
	}

	// 默认显示商品列表
	showProductList();

	// 商品列表页
	async function showProductList() {
		main.innerHTML = '<div class="container"><h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 30px; text-align: center;" class="gradient-text">精选商品</h2><div id="product-list">加载中...</div></div>';
		const products = await fetchProducts();
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
		document.getElementById('product-list').innerHTML = html || '<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">暂无商品</div>';
		
		// 点击商品卡片进入详情（除非点击的是按钮）
		document.querySelectorAll('.product-item').forEach(item => {
			item.onclick = (e) => {
				// 如果点击的是按钮，不触发卡片点击
				if (e.target.classList.contains('btn-detail') || e.target.classList.contains('btn-addcart')) {
					return;
				}
				showProductDetail(item.dataset.id);
			};
		});
		
		// 详情按钮
		document.querySelectorAll('.btn-detail').forEach(btn => {
			btn.onclick = (e) => {
				e.stopPropagation(); // 阻止事件冒泡
				showProductDetail(btn.dataset.id);
			};
		});
		
		// 加入购物车按钮
		document.querySelectorAll('.btn-addcart').forEach(btn => {
			btn.onclick = async (e) => {
				e.stopPropagation(); // 阻止事件冒泡
				const product = await fetchProductDetail(btn.dataset.id);
				addToCart(product, 1);
				// 显示更友好的提示
				showToast('✓ 已加入购物车');
			};
		});
	}

	// 商品详情页
	async function showProductDetail(id) {
		const p = await fetchProductDetail(id);
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
			addToCart(p, quantity);
			showToast(`✓ 已添加 ${quantity} 件到购物车`);
		};
		
		// 返回按钮
		document.getElementById('btn-back').onclick = () => {
			showProductList();
		};
	}

	// 购物车页
	function showCart() {
		let cart = getCart();
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
				removeFromCart(Number(btn.dataset.id));
				showToast('✓ 已移除商品');
				showCart();
			};
		});
		
		if (cart.length > 0) {
			document.getElementById('btn-checkout').onclick = async () => {
				const res = await createOrder(getCart(), total);
				if (res.order_id) {
					showToast('✓ 下单成功，订单号：' + res.order_id);
					clearCart();
					setTimeout(() => showOrders(), 1500);
				} else {
					showToast('✗ ' + (res.message || '下单失败'));
				}
			};
		}
	}

	// 订单列表页
	async function showOrders() {
		const orders = await fetchOrders();
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
								<div class="order-status status-${o.status}">${getStatusText(o.status)}</div>
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
				const detail = await fetchOrderDetail(btn.dataset.id);
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
									<span class="detail-value status-${detail.order.status}">${getStatusText(detail.order.status)}</span>
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
							<button class="neon-btn" onclick="history.back()">← 返回订单列表</button>
						</div>
					</div>
					<div>状态：${detail.order.status}</div>
					<div>商品列表：</div>
					<ul>
						${detail.items.map(i => `<li>${i.name} x ${i.quantity} ￥${i.price}</li>`).join('')}
					</ul>
					<div>总价：￥${detail.order.total_price}</div>
					<button onclick="history.back()">返回</button>
				`;
			};
		});
	}

	// Toast提示函数
	function showToast(message, duration = 2000) {
		// 移除已存在的toast
		const existingToast = document.querySelector('.toast-notification');
		if (existingToast) {
			existingToast.remove();
		}
		
		// 创建toast元素
		const toast = document.createElement('div');
		toast.className = 'toast-notification';
		toast.innerHTML = `<span>${message}</span>`;
		document.body.appendChild(toast);
		
		// 触发动画
		setTimeout(() => {
			toast.classList.add('show');
		}, 10);
		
		// 自动移除
		setTimeout(() => {
			toast.classList.remove('show');
			setTimeout(() => {
				toast.remove();
			}, 300);
		}, duration);
	}
});
