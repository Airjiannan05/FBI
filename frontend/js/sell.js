// ========== 发布商品功能 ========== //

let selectedImageFile = null;

// 加载类别到下拉框
async function loadSellCategories() {
	try {
		const categories = await window.api.fetchCategories();
		const sellSelect = document.getElementById('sell-category');
		const editSelect = document.getElementById('edit-category');
		const optionsHtml = '<option value="">选择商品类别（可选）</option>' +
			categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
		if (sellSelect) sellSelect.innerHTML = optionsHtml;
		if (editSelect) editSelect.innerHTML = optionsHtml;
	} catch (err) {
		console.error('加载类别失败:', err);
	}
}

// 显示发布商品弹窗
async function showSellModal() {
	const sellModal = document.getElementById('sell-modal');
	sellModal.style.display = 'block';
	document.getElementById('sell-error').textContent = '';
	document.getElementById('sell-success').style.display = 'none';
	await loadSellCategories();
}

// 图片预览
function previewImage(file) {
	const reader = new FileReader();
	reader.onload = (e) => {
		document.getElementById('sell-image-preview').innerHTML = `
			<img src="${e.target.result}" alt="预览" style="max-width: 100%; max-height: 200px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
			<div style="color: #94a3b8; font-size: 0.85rem; margin-top: 8px;">${file.name}</div>
		`;
	};
	reader.readAsDataURL(file);
}

// 初始化发布商品功能
function initSell() {
	// 关闭发布商品弹窗
	document.getElementById('close-sell').onclick = () => {
		document.getElementById('sell-modal').style.display = 'none';
		document.getElementById('sell-form').reset();
		selectedImageFile = null;
		document.getElementById('sell-image-preview').innerHTML = '';
	};

	// 上传区域点击事件
	const sellUploadArea = document.getElementById('sell-upload-area');
	const sellImageInput = document.getElementById('sell-image');
	
	sellUploadArea.onclick = () => sellImageInput.click();

	// 文件选择事件
	sellImageInput.onchange = (e) => {
		const file = e.target.files[0];
		if (file) {
			previewImage(file);
			selectedImageFile = file;
		}
	};

	// 拖拽上传
	sellUploadArea.ondragover = (e) => {
		e.preventDefault();
		sellUploadArea.style.borderColor = '#a855f7';
		sellUploadArea.style.background = 'rgba(30, 144, 255, 0.1)';
	};

	sellUploadArea.ondragleave = () => {
		sellUploadArea.style.borderColor = '#1e90ff';
		sellUploadArea.style.background = 'transparent';
	};

	sellUploadArea.ondrop = (e) => {
		e.preventDefault();
		sellUploadArea.style.borderColor = '#1e90ff';
		sellUploadArea.style.background = 'transparent';
		
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('image/')) {
			previewImage(file);
			selectedImageFile = file;
			sellImageInput.files = e.dataTransfer.files;
		}
	};

	// 发布商品表单提交
	document.getElementById('sell-form').onsubmit = async (e) => {
		e.preventDefault();
		
		const name = document.getElementById('sell-name').value.trim();
		const description = document.getElementById('sell-description').value.trim();
		const price = parseFloat(document.getElementById('sell-price').value);
		const stock = parseInt(document.getElementById('sell-stock').value);
		const sellError = document.getElementById('sell-error');
		const sellSuccess = document.getElementById('sell-success');

		// 验证
		if (!name || !description || !price || !stock) {
			sellError.textContent = '请填写所有字段';
			return;
		}

		if (!selectedImageFile) {
			sellError.textContent = '请上传商品图片';
			return;
		}

		if (price <= 0) {
			sellError.textContent = '价格必须大于0';
			return;
		}

		if (stock <= 0) {
			sellError.textContent = '库存必须大于0';
			return;
		}

		try {
			// 显示加载状态
			const submitBtn = e.target.querySelector('button[type="submit"]');
			submitBtn.disabled = true;
			submitBtn.textContent = '正在上传...';
			sellError.textContent = '';
			sellSuccess.style.display = 'none';

			// 1. 先上传图片到 OSS
			const uploadData = await window.api.uploadImage(selectedImageFile, 'products');

			if (!uploadData.success) {
				throw new Error(uploadData.message || '图片上传失败');
			}

			const imageUrl = uploadData.url;

			// 2. 获取当前用户
			const user = window.auth.getCurrentUser();
			if (!user) {
				throw new Error('请先登录');
			}

			// 3. 创建商品
			const categoryId = document.getElementById('sell-category').value;
			const productData = await window.api.createProduct({
				name,
				description,
				price,
				stock,
				image_url: imageUrl,
				user_id: user.id,
				category_id: categoryId || null
			});

			if (productData.message === '商品创建成功' || productData.id) {
				sellSuccess.textContent = '✓ 商品发布成功！';
				sellSuccess.style.display = 'block';
				window.utils.showToast('商品发布成功！', 3000);
				
				// 2秒后关闭弹窗并刷新商品管理页面
				setTimeout(() => {
					document.getElementById('sell-modal').style.display = 'none';
					document.getElementById('sell-form').reset();
					selectedImageFile = null;
					document.getElementById('sell-image-preview').innerHTML = '';
					// 如果当前在商品管理页面，刷新列表
					if (window.productManage && typeof window.productManage.loadMyProducts === 'function') {
						window.productManage.loadMyProducts();
					} else {
						window.products.showProductList();
					}
				}, 2000);
			} else {
				throw new Error(productData.message || '商品创建失败');
			}
		} catch (error) {
			sellError.textContent = error.message;
			window.utils.showToast('发布失败：' + error.message, 3000);
		} finally {
			const submitBtn = e.target.querySelector('button[type="submit"]');
			submitBtn.disabled = false;
			submitBtn.textContent = '发布商品';
		}
	};

	// 点击弹窗外关闭发布商品弹窗
	window.addEventListener('click', function(event) {
		const sellModal = document.getElementById('sell-modal');
		if (event.target === sellModal) {
			sellModal.style.display = 'none';
		}
	});
}

// 导出发布商品函数
window.sell = {
	showSellModal,
	initSell
};
