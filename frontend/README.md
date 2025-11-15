# 前端代码模块化说明

## 📁 文件结构

```
frontend/
├── index.html          # 主HTML文件
├── upload.html         # 图片上传测试页面
├── css/
│   └── style.css       # 全局样式
└── js/
    ├── app.js          # 应用入口，初始化和导航
    ├── utils.js        # 工具函数（Toast、状态文本）
    ├── api.js          # API接口封装
    ├── cart.js         # 购物车本地存储管理
    ├── auth.js         # 用户认证（登录/注册/注销）
    ├── products.js     # 商品列表和详情页面
    ├── cartPage.js     # 购物车页面
    ├── orders.js       # 订单列表和详情页面
    ├── sell.js         # 发布商品功能
    └── main.js         # 旧版本（可以删除）
```

## 📦 模块说明

### 1. **app.js** - 应用入口
- **职责**：初始化所有模块、页面导航、Hero按钮事件
- **依赖**：所有其他模块
- **导出**：无（作为入口文件）

### 2. **utils.js** - 工具函数
- **职责**：通用工具函数
- **功能**：
  - `getStatusText(status)` - 订单状态文本转换
  - `showToast(message, duration)` - Toast通知
- **导出**：`window.utils`

### 3. **api.js** - API接口
- **职责**：封装所有后端API调用
- **功能**：
  - 商品API：`fetchProducts()`, `fetchProductDetail()`, `createProduct()`
  - 订单API：`fetchOrders()`, `fetchOrderDetail()`, `createOrder()`
  - 用户API：`registerUser()`, `loginUser()`, `logoutUser()`, `getProfile()`
  - 上传API：`uploadImage()`
- **导出**：`window.api`

### 4. **cart.js** - 购物车管理
- **职责**：购物车本地存储操作
- **功能**：
  - `getCart()` - 获取购物车
  - `setCart()` - 保存购物车
  - `addToCart()` - 添加商品
  - `removeFromCart()` - 移除商品
  - `clearCart()` - 清空购物车
- **导出**：`window.cart`

### 5. **auth.js** - 用户认证
- **职责**：登录、注册、注销功能
- **功能**：
  - `initAuth()` - 初始化认证事件
  - `updateNavAuth()` - 更新导航栏状态
  - 登录/注册表单提交
  - 弹窗管理
- **导出**：`window.auth`

### 6. **products.js** - 商品页面
- **职责**：商品列表和详情页面
- **功能**：
  - `showProductList()` - 显示商品列表
  - `showProductDetail(id)` - 显示商品详情
  - 商品卡片交互
  - 加入购物车
- **导出**：`window.products`

### 7. **cartPage.js** - 购物车页面
- **职责**：购物车UI展示和结算
- **功能**：
  - `showCart()` - 显示购物车页面
  - 移除商品
  - 立即结算
- **导出**：`window.cartPage`

### 8. **orders.js** - 订单页面
- **职责**：订单列表和详情展示
- **功能**：
  - `showOrders()` - 显示订单列表
  - `showOrderDetail(id)` - 显示订单详情
- **导出**：`window.orders`

### 9. **sell.js** - 发布商品
- **职责**：商品发布功能
- **功能**：
  - `showSellModal()` - 显示发布弹窗
  - `initSell()` - 初始化发布功能
  - 图片上传和预览
  - 表单验证和提交
- **导出**：`window.sell`

## 🔄 加载顺序

HTML 中的 JS 文件按以下顺序加载（重要！）：

```html
<script src="js/utils.js"></script>     <!-- 1. 工具函数 -->
<script src="js/api.js"></script>       <!-- 2. API接口 -->
<script src="js/cart.js"></script>      <!-- 3. 购物车 -->
<script src="js/auth.js"></script>      <!-- 4. 认证 -->
<script src="js/products.js"></script>  <!-- 5. 商品 -->
<script src="js/cartPage.js"></script>  <!-- 6. 购物车页面 -->
<script src="js/orders.js"></script>    <!-- 7. 订单 -->
<script src="js/sell.js"></script>      <!-- 8. 发布商品 -->
<script src="js/app.js"></script>       <!-- 9. 应用入口（最后） -->
```

## 🎯 模块间依赖关系

```
app.js
  ├── auth.js
  │   └── api.js
  ├── sell.js
  │   ├── api.js
  │   ├── utils.js
  │   └── products.js
  ├── products.js
  │   ├── api.js
  │   ├── cart.js
  │   └── utils.js
  ├── cartPage.js
  │   ├── cart.js
  │   ├── api.js
  │   ├── utils.js
  │   └── orders.js
  └── orders.js
      ├── api.js
      └── utils.js
```

## ✨ 优势

1. **代码组织清晰**：每个模块职责单一，易于维护
2. **便于调试**：问题定位更准确
3. **可复用性高**：工具函数和API可以在多处使用
4. **团队协作友好**：不同开发者可以同时编辑不同模块
5. **易于扩展**：添加新功能只需创建新模块
6. **降低耦合度**：模块间通过 `window` 对象通信

## 🚀 如何使用

直接在浏览器中打开 `index.html` 即可，所有模块会自动加载。

## 📝 注意事项

1. **main.js 已废弃**：原来的 `main.js` 功能已完全拆分，可以删除
2. **保持加载顺序**：必须按照 HTML 中的顺序加载 JS 文件
3. **全局命名空间**：所有模块通过 `window.模块名` 导出，避免命名冲突
4. **模块独立性**：每个模块应该只关注自己的职责

## 🔧 未来优化方向

1. 使用 ES6 模块化（`import/export`）
2. 引入构建工具（Webpack/Vite）
3. TypeScript 支持
4. 状态管理（如果应用继续扩展）
