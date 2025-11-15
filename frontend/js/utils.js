// ========== 工具函数 ========== //

// 获取订单状态文本
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

// 导出函数
window.utils = {
	getStatusText,
	showToast
};
