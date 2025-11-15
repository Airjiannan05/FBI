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

// 导出购物车函数
window.cart = {
	getCart,
	setCart,
	addToCart,
	removeFromCart,
	clearCart
};
