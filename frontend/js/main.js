
// ========== 用户相关前端逻辑 ========== //

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
	// 登录示例
	document.getElementById('nav-login').onclick = async () => {
		const username = prompt('用户名:');
		const password = prompt('密码:');
		const data = await loginUser(username, password);
		if (data.token) {
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));
			alert('登录成功');
		} else {
			alert(data.message || '登录失败');
		}
	};

	// 注册示例
	document.getElementById('nav-register').onclick = async () => {
		const username = prompt('用户名:');
		const password = prompt('密码:');
		const email = prompt('邮箱:');
		const data = await registerUser(username, password, email);
		alert(data.message);
	};

	// 注销示例
	document.getElementById('nav-logout').onclick = () => {
		logoutUser();
	};

	// 自动显示/隐藏登录、注销按钮
	if (localStorage.getItem('token')) {
		document.getElementById('nav-login').style.display = 'none';
		document.getElementById('nav-register').style.display = 'none';
		document.getElementById('nav-logout').style.display = '';
	} else {
		document.getElementById('nav-login').style.display = '';
		document.getElementById('nav-register').style.display = '';
		document.getElementById('nav-logout').style.display = 'none';
	}
});
