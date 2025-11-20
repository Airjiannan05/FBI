// ========== 用户认证模块 ========== //

// 登录状态切换导航栏
function updateNavAuth() {
	if (localStorage.getItem('token')) {
		document.getElementById('nav-login').style.display = 'none';
		document.getElementById('nav-register').style.display = 'none';
		document.getElementById('nav-logout').style.display = '';
		document.getElementById('nav-manage').style.display = '';
		document.getElementById('nav-sales').style.display = '';
	} else {
		document.getElementById('nav-login').style.display = '';
		document.getElementById('nav-register').style.display = '';
		document.getElementById('nav-logout').style.display = 'none';
		document.getElementById('nav-manage').style.display = 'none';
		document.getElementById('nav-sales').style.display = 'none';
	}
}

// 获取当前登录用户
function getCurrentUser() {
	const userStr = localStorage.getItem('user');
	return userStr ? JSON.parse(userStr) : null;
}

// 初始化认证相关事件
function initAuth() {
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
		const data = await window.api.loginUser(username, password);
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
		const data = await window.api.registerUser(username, password, email);
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
		window.api.logoutUser();
		updateNavAuth();
	};

	// 点击弹窗外关闭
	window.onclick = function(event) {
		if (event.target === loginModal) loginModal.style.display = 'none';
		if (event.target === registerModal) registerModal.style.display = 'none';
	};

	// 初始化导航栏状态
	updateNavAuth();
}

// 导出认证函数
window.auth = {
	initAuth,
	updateNavAuth,
	getCurrentUser
};
