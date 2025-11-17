// ========== 商品管理功能 ========== //
console.log('📦 productManage.js 已加载');

// 显示商品管理页面（我的商品列表）
async function showMyProducts() {
	console.log('⚙️ 调用 showMyProducts() - 显示商品管理页面');
	const main = document.getElementById('main-content');
	
	// 检查登录状态
	const user = window.auth.getCurrentUser();
	if (!user) {
		window.utils.showToast('请先登录');
		return;
	}
	
		main.innerHTML = `
		<div class="container">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
				<div>
					<h2 style="font-family: Orbitron, sans-serif; font-size: 2.5rem; margin-bottom: 8px;" class="gradient-text">⚙️ 商品管理</h2>
					<p style="color: var(--color-text-muted); font-size: 0.95rem;">管理你发布的商品，编辑或删除</p>
				</div>
				<button id="btn-add-product" class="neon-btn">
					<span>+ 发布新商品</span>
				</button>
			</div>
			<div id="my-products-list">加载中...</div>
		</div>
	`;
	
	// 发布新商品按钮
	document.getElementById('btn-add-product').onclick = () => {
		window.sell.showSellModal();
	};
	
	// 加载我的商品列表
	await loadMyProducts();
}

// 加载我的商品列表
async function loadMyProducts() {
	try {
		const response = await window.api.fetchMyProducts();
		const products = response.products || [];
		
		const listContainer = document.getElementById('my-products-list');
		
		if (products.length === 0) {
			listContainer.innerHTML = `
				<div style="text-align: center; padding: 60px; color: var(--color-text-muted);">
					<div style="font-size: 3rem; margin-bottom: 20px;">📦</div>
					<p style="font-size: 1.2rem; margin-bottom: 20px;">暂无商品</p>
					<button onclick="window.sell.showSellModal()" class="neon-btn">
						<span>立即发布</span>
					</button>
				</div>
			`;
			return;
		}
		
		// 渲染商品表格
		listContainer.innerHTML = `
			<div class="manage-table-wrapper">
				<table class="manage-table">
					<thead>
						<tr>
							<th style="width: 80px;">图片</th>
							<th>商品名称</th>
							<th style="width: 120px;">价格</th>
							<th style="width: 100px;">库存</th>
							<th style="width: 150px;">创建时间</th>
							<th style="width: 180px;">操作</th>
						</tr>
					</thead>
					<tbody>
						${products.map(p => `
							<tr>
								<td>
									<img src="${p.image_url || 'https://via.placeholder.com/80'}" 
										 alt="${p.name}" 
										 style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
								</td>
								<td>
									<div style="font-weight: 600;">${p.name}</div>
									<div style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 4px;">
										${p.description ? (p.description.length > 50 ? p.description.substring(0, 50) + '...' : p.description) : '暂无描述'}
									</div>
								</td>
								<td><span style="color: var(--color-primary); font-weight: 600;">￥${p.price}</span></td>
								<td>
									<span class="stock-badge ${p.stock > 10 ? 'stock-normal' : (p.stock > 0 ? 'stock-low' : 'stock-out')}">
										${p.stock}
									</span>
								</td>
								<td style="color: var(--color-text-muted); font-size: 0.9rem;">
									${new Date(p.created_at).toLocaleDateString('zh-CN')}
								</td>
								<td>
									<div style="display: flex; gap: 8px; justify-content: center;">
										<button class="btn-manage btn-edit" data-id="${p.id}" title="编辑">
											<span>✏️ 编辑</span>
										</button>
										<button class="btn-manage btn-delete" data-id="${p.id}" title="删除">
											<span>🗑️ 删除</span>
										</button>
									</div>
								</td>
							</tr>
						`).join('')}
					</tbody>
				</table>
			</div>
		`;
		
		// 绑定编辑按钮事件
		document.querySelectorAll('.btn-edit').forEach(btn => {
			btn.onclick = () => showEditModal(btn.dataset.id);
		});
		
		// 绑定删除按钮事件
		document.querySelectorAll('.btn-delete').forEach(btn => {
			btn.onclick = () => deleteProduct(btn.dataset.id);
		});
		
	} catch (err) {
		document.getElementById('my-products-list').innerHTML = `
			<div style="text-align: center; padding: 60px; color: var(--color-accent);">
				<p>加载失败：${err.message}</p>
			</div>
		`;
	}
}

// 显示编辑商品弹窗
async function showEditModal(productId) {
	try {
		// 获取商品详情
		const response = await window.api.fetchProductDetail(productId);
		const product = response.product || response;
		
		// 获取编辑弹窗
		const editModal = document.getElementById('edit-product-modal');
		
		// 填充表单数据
		document.getElementById('edit-product-id').value = product.id;
		document.getElementById('edit-name').value = product.name;
		document.getElementById('edit-description').value = product.description || '';
		document.getElementById('edit-price').value = product.price;
		document.getElementById('edit-stock').value = product.stock;
		
		// 清空之前的错误和成功信息
		document.getElementById('edit-error').textContent = '';
		document.getElementById('edit-success').style.display = 'none';
		editImageFile = null; // 清空之前选择的图片
		
		// 显示当前图片
		if (product.image_url) {
			document.getElementById('edit-image-preview').innerHTML = `
				<div style="text-align: center;">
					<img src="${product.image_url}" alt="当前图片" style="max-width: 100%; max-height: 200px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
					<div style="color: #94a3b8; font-size: 0.85rem; margin-top: 8px;">当前图片（不更换请留空）</div>
				</div>
			`;
		} else {
			document.getElementById('edit-image-preview').innerHTML = '';
		}
		
		// 显示弹窗
		editModal.style.display = 'block';
		
	} catch (err) {
		window.utils.showToast('获取商品信息失败：' + err.message);
	}
}

// 初始化编辑弹窗事件
let editImageFile = null;

function initEditModal() {
	const editModal = document.getElementById('edit-product-modal');
	const closeBtn = document.getElementById('close-edit-product');
	const editForm = document.getElementById('edit-product-form');
	const editUploadArea = document.getElementById('edit-upload-area');
	const editImageInput = document.getElementById('edit-image');
	
	// 关闭弹窗
	closeBtn.onclick = () => {
		editModal.style.display = 'none';
		editForm.reset();
		editImageFile = null;
		document.getElementById('edit-image-preview').innerHTML = '';
		document.getElementById('edit-error').textContent = '';
		document.getElementById('edit-success').style.display = 'none';
	};
	
	// 图片上传
	editUploadArea.onclick = () => editImageInput.click();
	
	editImageInput.onchange = (e) => {
		const file = e.target.files[0];
		if (file) {
			// 验证文件大小
			if (file.size > 5 * 1024 * 1024) {
				window.utils.showToast('图片大小不能超过5MB');
				return;
			}
			
			const reader = new FileReader();
			reader.onload = (e) => {
				document.getElementById('edit-image-preview').innerHTML = `
					<div style="text-align: center;">
						<img src="${e.target.result}" alt="新图片预览" style="max-width: 100%; max-height: 200px; border-radius: 12px; border: 1px solid rgba(148, 163, 184, 0.2);">
						<div style="color: #10b981; font-size: 0.85rem; margin-top: 8px;">✓ 新图片（${file.name}）</div>
					</div>
				`;
			};
			reader.readAsDataURL(file);
			editImageFile = file;
		}
	};
	
	// 拖拽上传
	editUploadArea.ondragover = (e) => {
		e.preventDefault();
		editUploadArea.style.borderColor = '#1e90ff';
	};
	
	editUploadArea.ondragleave = () => {
		editUploadArea.style.borderColor = 'rgba(148, 163, 184, 0.2)';
	};
	
	editUploadArea.ondrop = (e) => {
		e.preventDefault();
		editUploadArea.style.borderColor = 'rgba(148, 163, 184, 0.2)';
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith('image/')) {
			editImageInput.files = e.dataTransfer.files;
			editImageInput.dispatchEvent(new Event('change'));
		}
	};
	
	// 表单提交
	editForm.onsubmit = async (e) => {
		e.preventDefault();
		
		const editError = document.getElementById('edit-error');
		const editSuccess = document.getElementById('edit-success');
		editError.textContent = '';
		editSuccess.style.display = 'none';
		
		const productId = document.getElementById('edit-product-id').value;
		const name = document.getElementById('edit-name').value.trim();
		const description = document.getElementById('edit-description').value.trim();
		const price = parseFloat(document.getElementById('edit-price').value);
		const stock = parseInt(document.getElementById('edit-stock').value);
		
		if (!name || !price || stock < 0) {
			editError.textContent = '请填写所有必填字段';
			return;
		}
		
		const submitBtn = e.target.querySelector('button[type="submit"]');
		submitBtn.disabled = true;
		submitBtn.textContent = '保存中...';
		
		try {
			let imageUrl = null;
			
			// 如果选择了新图片，先上传
			if (editImageFile) {
				editSuccess.textContent = '正在上传图片...';
				editSuccess.style.display = 'block';
				
				const uploadData = await window.api.uploadImage(editImageFile, 'products');
				if (!uploadData.success) {
					throw new Error(uploadData.message || '图片上传失败');
				}
				imageUrl = uploadData.url;
			}
			
			// 更新商品
			editSuccess.textContent = '正在更新商品...';
			const updateData = {
				name,
				description,
				price,
				stock
			};
			
			// 只有上传了新图片才更新图片URL
			if (imageUrl) {
				updateData.image_url = imageUrl;
			}
			
			const result = await window.api.updateProduct(productId, updateData);
			
			if (result.message === '商品更新成功') {
				editSuccess.textContent = '✓ 商品更新成功！';
				window.utils.showToast('商品更新成功！');
				
				// 1秒后关闭弹窗并刷新列表
				setTimeout(() => {
					editModal.style.display = 'none';
					editForm.reset();
					editImageFile = null;
					document.getElementById('edit-image-preview').innerHTML = '';
					loadMyProducts();
				}, 1000);
			} else {
				throw new Error(result.message || '更新失败');
			}
		} catch (error) {
			editError.textContent = error.message;
			window.utils.showToast('更新失败：' + error.message);
		} finally {
			submitBtn.disabled = false;
			submitBtn.textContent = '保存修改';
		}
	};
	
	// 点击弹窗外关闭
	window.addEventListener('click', function(event) {
		if (event.target === editModal) {
			editModal.style.display = 'none';
		}
	});
}

// 删除商品
async function deleteProduct(productId) {
	if (!confirm('确定要删除这个商品吗？此操作不可恢复！')) {
		return;
	}
	
	try {
		const result = await window.api.deleteProduct(productId);
		
		if (result.message === '商品删除成功') {
			window.utils.showToast('✓ 商品删除成功');
			loadMyProducts();
		} else {
			throw new Error(result.message || '删除失败');
		}
	} catch (err) {
		window.utils.showToast('删除失败：' + err.message);
	}
}

// 页面加载时初始化编辑弹窗事件
document.addEventListener('DOMContentLoaded', () => {
	initEditModal();
});

// 导出商品管理函数
window.productManage = {
	showMyProducts,
	loadMyProducts
};
console.log('✅ window.productManage 已导出:', window.productManage);
