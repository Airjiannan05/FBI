// ========== API 接口封装 ========== //

// ========== 商品相关API ========== //
async function fetchProducts(searchKeyword = '') {
	let url = '/api/product';
	if (searchKeyword && searchKeyword.trim()) {
		url += `?search=${encodeURIComponent(searchKeyword.trim())}`;
	}
	const res = await fetch(url);
	return (await res.json()).products || [];
}

async function fetchProductDetail(id) {
	const res = await fetch(`/api/product/${id}`);
	return (await res.json()).product;
}

async function createProduct(productData) {
	const res = await fetch('/api/product', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(productData)
	});
	return await res.json();
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

async function payOrder(orderId, paymentMethod) {
	const res = await fetch(`/api/order/${orderId}/pay`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ payment_method: paymentMethod })
	});
	return await res.json();
}

async function shipOrder(orderId, trackingNumber, carrier) {
	const res = await fetch(`/api/order/${orderId}/ship`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ 
			tracking_number: trackingNumber,
			carrier: carrier
		})
	});
	return await res.json();
}

// ========== 用户相关API ========== //
async function registerUser(username, password, email) {
	const res = await fetch('/api/user/register', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password, email })
	});
	return res.json();
}

async function loginUser(username, password) {
	const res = await fetch('/api/user/login', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ username, password })
	});
	return res.json();
}

function logoutUser() {
	localStorage.removeItem('token');
	localStorage.removeItem('user');
	alert('已注销');
}

async function getProfile() {
	const token = localStorage.getItem('token');
	if (!token) return null;
	const res = await fetch('/api/user/profile', {
		headers: { 'Authorization': 'Bearer ' + token }
	});
	return res.json();
}

// ========== 图片上传API ========== //
async function uploadImage(file, folder = 'products') {
	const formData = new FormData();
	formData.append('file', file);
	formData.append('folder', folder);

	const res = await fetch('/api/upload/image', {
		method: 'POST',
		body: formData
	});
	return await res.json();
}

// 导出API函数
window.api = {
	fetchProducts,
	fetchProductDetail,
	createProduct,
	fetchOrders,
	fetchOrderDetail,
	createOrder,
	payOrder,
	shipOrder,
	registerUser,
	loginUser,
	logoutUser,
	getProfile,
	uploadImage
};
