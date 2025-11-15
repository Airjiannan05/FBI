// ========== 主应用入口 ========== //

document.addEventListener('DOMContentLoaded', () => {
	const main = document.getElementById('main-content');
	const heroSection = document.querySelector('.hero');
	
	// 初始化认证模块
	window.auth.initAuth();
	
	// 初始化发布商品功能
	window.sell.initSell();
	
	// 页面导航
	document.getElementById('nav-home').onclick = () => {
		if (heroSection) heroSection.style.display = 'flex';
		window.products.showProductList();
	};
	
	document.getElementById('nav-products').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		window.products.showProductList();
	};
	
	document.getElementById('nav-cart').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		window.cartPage.showCart();
	};
	
	document.getElementById('nav-orders').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		window.orders.showOrders();
	};
	
	document.getElementById('nav-sell').onclick = () => {
		if (heroSection) heroSection.style.display = 'none';
		window.sell.showSellModal();
	};

	// Hero区域"开始浏览"按钮点击事件
	const heroCta = document.querySelector('.hero-cta');
	if (heroCta) {
		heroCta.onclick = (e) => {
			e.preventDefault();
			if (heroSection) {
				heroSection.style.display = 'none';
			}
			window.products.showProductList();
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
		
		const navLinks = mainNav.querySelectorAll('.nav-link, .neon-btn');
		navLinks.forEach(link => {
			link.addEventListener('click', () => {
				mainNav.classList.remove('open');
			});
		});
	}

	// 默认显示商品列表
	window.products.showProductList();
});
