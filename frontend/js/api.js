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
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify(productData)
  });
  return await res.json();
}

async function fetchMyProducts() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return { products: [] };
  const res = await fetch(`/api/product/my?user_id=${user.id}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function updateProduct(productId, productData) {
  const res = await fetch(`/api/product/${productId}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify(productData)
  });
  return await res.json();
}

async function deleteProduct(productId) {
  const res = await fetch(`/api/product/${productId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// ========== 类别相关API ========== //
async function fetchCategories() {
  const res = await fetch('/api/category');
  return (await res.json()).categories || [];
}

async function createCategory(name, description) {
  const res = await fetch('/api/category', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ name, description })
  });
  return await res.json();
}

async function updateCategory(id, name, description) {
  const res = await fetch(`/api/category/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ name, description })
  });
  return await res.json();
}

async function deleteCategory(id) {
  const res = await fetch(`/api/category/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// ========== 订单相关API ========== //
async function fetchOrders() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return [];
  const res = await fetch(`/api/order?user_id=${user.id}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return (await res.json()).orders || [];
}

async function fetchOrderDetail(id) {
  const res = await fetch(`/api/order/${id}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function createOrder(items, total_price) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return { message: '未登录' };
  const res = await fetch('/api/order', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
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
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ payment_method: paymentMethod })
  });
  return await res.json();
}

async function shipOrder(orderId, trackingNumber, carrier) {
  const res = await fetch(`/api/order/${orderId}/ship`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ 
      tracking_number: trackingNumber,
      carrier: carrier
    })
  });
  return await res.json();
}

// ========== 用户相关API ========== //
async function registerUser(username, password, email, role = 'buyer') {
  const res = await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, role })
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

// ========== 销售统计相关API ========== //
async function fetchSellerOrders(status = '', startDate = '', endDate = '') {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return [];
  
  let url = `/api/sales/orders?seller_id=${user.id}`;
  if (status) url += `&status=${status}`;
  if (startDate) url += `&start_date=${startDate}`;
  if (endDate) url += `&end_date=${endDate}`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  const data = await res.json();
  return data.orders || [];
}

async function fetchSalesStatistics(period = 'month') {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return {};
  
  const res = await fetch(`/api/sales/statistics?seller_id=${user.id}&period=${period}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function fetchProductSalesDetail(productId) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return {};
  
  const res = await fetch(`/api/sales/product/${productId}?seller_id=${user.id}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// ========== 推荐系统API ========== //
async function fetchAlsoBought(productId, limit = 5) {
  const res = await fetch(`/api/recommend/also-bought?product_id=${productId}&limit=${limit}`);
  return (await res.json()).recommendations || [];
}

async function fetchPersonalRecommend(limit = 10) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (!user) return [];
  const res = await fetch(`/api/recommend/personal?user_id=${user.id}&limit=${limit}`);
  return (await res.json()).recommendations || [];
}

// ========== 数据采集 + 预测 + 异常 ========== //
async function startBrowseTracking(productId, categoryId) {
  const res = await fetch('/api/analytics/start-browse', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ product_id: productId, category_id: categoryId })
  });
  return await res.json();
}

async function endBrowseTracking(browseId) {
  if (navigator.sendBeacon) {
    navigator.sendBeacon(`/api/analytics/end-browse/${browseId}`);
  } else {
    await fetch(`/api/analytics/end-browse/${browseId}`, {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
    });
  }
}

async function fetchSalesPrediction(sellerId, days = 30) {
  const res = await fetch(`/api/sales/prediction?seller_id=${sellerId || ''}&days=${days}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function fetchSalesAnomalies(sellerId, days = 30) {
  const res = await fetch(`/api/sales/anomalies?seller_id=${sellerId || ''}&days=${days}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function fetchSalesRanking(type = 'sales', categoryId = '', limit = 20) {
  let url = `/api/sales/ranking?type=${type}&limit=${limit}`;
  if (categoryId) url += `&category_id=${categoryId}`;
  const res = await fetch(url);
  return (await res.json()).ranking || [];
}

// ========== Admin相关API ========== //
async function fetchAdminSalesList() {
  const res = await fetch('/api/admin/sales', {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return (await res.json()).sellers || [];
}

async function addSeller(userId) {
  const res = await fetch('/api/admin/sales', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ user_id: userId })
  });
  return await res.json();
}

async function removeSeller(userId) {
  const res = await fetch(`/api/admin/sales/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function resetPassword(userId, newPassword) {
  const res = await fetch(`/api/admin/reset-password/${userId}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')
    },
    body: JSON.stringify({ new_password: newPassword })
  });
  return await res.json();
}

async function fetchAdminOverview() {
  const res = await fetch('/api/admin/statistics/overview', {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

async function fetchAdminTrend(period = 'day', days = 30) {
  const res = await fetch(`/api/admin/statistics/trend?period=${period}&days=${days}`, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 浏览日志
async function fetchBrowseLogs({ page = 1, limit = 20, userId = '', productId = '', sellerId = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (userId) params.set('userId', userId);
  if (productId) params.set('productId', productId);
  if (sellerId) params.set('sellerId', sellerId);
  else if (user && user.role === 'seller') params.set('sellerId', user.id);
  const res = await fetch('/api/analytics/browse-logs?' + params, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 购买日志
async function fetchPurchaseLogs({ page = 1, limit = 20, userId = '', status = '', sellerId = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (userId) params.set('userId', userId);
  if (status) params.set('status', status);
  if (sellerId) params.set('sellerId', sellerId);
  else if (user && user.role === 'seller') params.set('sellerId', user.id);
  const res = await fetch('/api/analytics/purchase-logs?' + params, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 用户列表
async function fetchUsers(search = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const res = await fetch('/api/analytics/users?' + params, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 用户画像
async function fetchUserProfile(userId) {
  const res = await fetch('/api/analytics/profile/' + userId, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 登录日志
async function fetchLoginLogs({ userId, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (userId) params.set('userId', userId);
  const res = await fetch('/api/user/login-logs?' + params, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 操作日志（仅管理员可查）
async function fetchOperationLogs({ page = 1, limit = 20, userId = '', operationType = '' } = {}) {
  const params = new URLSearchParams({ page, limit });
  if (userId) params.set('userId', userId);
  if (operationType) params.set('operationType', operationType);
  const res = await fetch('/api/analytics/operation-logs?' + params, {
    headers: { 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '') }
  });
  return await res.json();
}

// 导出API函数
window.api = {
  fetchProducts,
  fetchProductDetail,
  createProduct,
  fetchMyProducts,
  updateProduct,
  deleteProduct,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchOrders,
  fetchOrderDetail,
  createOrder,
  payOrder,
  shipOrder,
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  uploadImage,
  fetchSellerOrders,
  fetchSalesStatistics,
  fetchProductSalesDetail,
  fetchAlsoBought,
  fetchPersonalRecommend,
  startBrowseTracking,
  endBrowseTracking,
  fetchSalesPrediction,
  fetchSalesAnomalies,
  fetchSalesRanking,
  fetchAdminSalesList,
  addSeller,
  removeSeller,
  resetPassword,
  fetchAdminOverview,
  fetchAdminTrend,
  fetchBrowseLogs,
  fetchPurchaseLogs,
  fetchUsers,
  fetchUserProfile,
  fetchLoginLogs,
  fetchOperationLogs
};
