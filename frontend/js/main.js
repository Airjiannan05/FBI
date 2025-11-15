
// ========== 用户相关前端逻辑 ========== //

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

// ========== 示例UI交互 ========== //
// 这里只做简单演示，实际可结合表单和页面渲染
document.addEventListener('DOMContentLoaded', () => {
	// 页面切换
	const main = document.getElementById('main-content');
	document.getElementById('nav-home').onclick = showProductList;
	document.getElementById('nav-products').onclick = showProductList;
	document.getElementById('nav-cart').onclick = showCart;
	document.getElementById('nav-orders').onclick = showOrders;

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

	// 默认显示商品列表
	showProductList();

	// 商品列表页
	async function showProductList() {
		main.innerHTML = '<h2>商品列表</h2><div id="product-list">加载中...</div>';
		const products = await fetchProducts();
		const html = products.map(p => `
			<div class="product-item">
				<img src="${p.image_url || 'https://via.placeholder.com/100'}" alt="${p.name}" class="product-img">
				<div class="product-info">
					<h3>${p.name}</h3>
					<p>￥${p.price}</p>
					<button data-id="${p.id}" class="btn-detail">详情</button>
					<button data-id="${p.id}" class="btn-addcart">加入购物车</button>
				</div>
			</div>
		`).join('');
		document.getElementById('product-list').innerHTML = html || '暂无商品';
		// 详情按钮
		document.querySelectorAll('.btn-detail').forEach(btn => {
			btn.onclick = () => showProductDetail(btn.dataset.id);
		});
		// 加入购物车按钮
		document.querySelectorAll('.btn-addcart').forEach(btn => {
			btn.onclick = async () => {
				const product = await fetchProductDetail(btn.dataset.id);
				addToCart(product, 1);
				alert('已加入购物车');
			};
		});
	}

	// 商品详情页
	async function showProductDetail(id) {
		const p = await fetchProductDetail(id);
		main.innerHTML = `
			<h2>商品详情</h2>
			<div class="product-detail">
				<img src="${p.image_url || 'https://via.placeholder.com/150'}" alt="${p.name}" class="product-img-large">
				<div class="product-info">
					<h3>${p.name}</h3>
					<p>${p.description || ''}</p>
					<p>￥${p.price}</p>
					<p>库存：${p.stock}</p>
					<button id="btn-addcart-detail">加入购物车</button>
					<button onclick="history.back()">返回</button>
				</div>
			</div>
		`;
		document.getElementById('btn-addcart-detail').onclick = () => {
			addToCart(p, 1);
			alert('已加入购物车');
		};
	}

	// 购物车页
	function showCart() {
		let cart = getCart();
		let total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		main.innerHTML = `
			<h2>购物车</h2>
			<div id="cart-list">
				${cart.length === 0 ? '购物车为空' : cart.map(item => `
					<div class="cart-item">
						<img src="${item.image_url || 'https://via.placeholder.com/60'}" class="cart-img">
						<span>${item.name}</span>
						<span>￥${item.price} x ${item.quantity}</span>
						<button data-id="${item.id}" class="btn-remove">移除</button>
					</div>
				`).join('')}
			</div>
			<div>总价：￥${total}</div>
			<button id="btn-checkout" ${cart.length === 0 ? 'disabled' : ''}>结算</button>
		`;
		document.querySelectorAll('.btn-remove').forEach(btn => {
			btn.onclick = () => {
				removeFromCart(Number(btn.dataset.id));
				showCart();
			};
		});
		document.getElementById('btn-checkout').onclick = async () => {
			const res = await createOrder(getCart(), total);
			if (res.order_id) {
				alert('下单成功，订单号：' + res.order_id);
				clearCart();
				showOrders();
			} else {
				alert(res.message || '下单失败');
			}
		};
	}

	// 订单列表页
	async function showOrders() {
		const orders = await fetchOrders();
		main.innerHTML = '<h2>我的订单</h2>' + (orders.length === 0 ? '暂无订单' : `
			<div id="order-list">
				${orders.map(o => `
					<div class="order-item">
						<span>订单号：${o.id}</span>
						<span>总价：￥${o.total_price}</span>
						<span>状态：${o.status}</span>
						<button data-id="${o.id}" class="btn-order-detail">详情</button>
					</div>
				`).join('')}
			</div>
		`);
		document.querySelectorAll('.btn-order-detail').forEach(btn => {
			btn.onclick = async () => {
				const detail = await fetchOrderDetail(btn.dataset.id);
				main.innerHTML = `
					<h2>订单详情</h2>
					<div>订单号：${detail.order.id}</div>
					<div>下单时间：${detail.order.created_at}</div>
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

	// 登录/注册/注销按钮逻辑和弹窗（如你已有的实现）
	// ...existing code...
});
