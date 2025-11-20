# 销售统计模块开发文档

## 📊 功能概述

销售统计模块为商家提供全面的订单管理和销售数据分析功能,包括:

### 1. 数据概览
- **统计卡片**: 总销售额、订单数、商品销量、在售商品数
- **订单状态分布**: 各状态订单数量和金额的可视化展示
- **销售趋势图**: 最近30天的销售趋势条形图
- **热销商品Top 10**: 按销量排名的热门商品列表

### 2. 订单管理
- **订单列表**: 显示所有购买你商品的订单
- **订单筛选**: 按状态、日期范围筛选
- **订单详情**: 买家信息、商品明细、支付状态等
- **发货功能**: 为已支付订单安排发货,输入快递信息

### 3. 商品销售
- **销售排行榜**: 按销量展示商品排名
- **销售数据**: 每个商品的销量和销售额统计
- **前三名高亮**: 金牌🥇、银牌🥈、铜牌🥉视觉效果

---

## 🔧 技术实现

### 后端 API

#### 1. 销售订单列表
**路由**: `GET /api/sales/orders`

**参数**:
- `seller_id` (必需): 商家用户ID
- `status` (可选): 订单状态筛选
- `start_date` (可选): 开始日期
- `end_date` (可选): 结束日期

**返回**: 订单列表,包含买家信息和商品明细

**SQL逻辑**:
```sql
SELECT DISTINCT o.*, u.username as buyer_name, u.email as buyer_email
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
LEFT JOIN users u ON o.user_id = u.id
WHERE p.user_id = ? -- 通过商品归属筛选订单
ORDER BY o.created_at DESC
```

#### 2. 销售统计数据
**路由**: `GET /api/sales/statistics`

**参数**:
- `seller_id` (必需): 商家用户ID
- `period` (可选): 统计周期 (day/week/month/year)

**返回数据结构**:
```javascript
{
  summary: {
    total_orders: 100,
    total_sales: 50000.00,
    total_products_sold: 20,
    total_items_sold: 500
  },
  statusBreakdown: [
    { status: '已支付', count: 50, amount: 25000 },
    { status: '已发货', count: 30, amount: 15000 },
    ...
  ],
  trend: [
    { date: '2025-11-01', order_count: 5, sales_amount: 2500, items_sold: 20 },
    ...
  ],
  topProducts: [
    { id: 1, name: '商品A', sold_count: 100, sales_amount: 10000, ... },
    ...
  ],
  recentDaily: [ ... ]
}
```

#### 3. 商品销售详情
**路由**: `GET /api/sales/product/:productId`

**参数**:
- `productId` (路径参数): 商品ID
- `seller_id` (查询参数): 商家用户ID

**返回**: 商品基本信息、销售统计、每日销售趋势

---

### 前端实现

#### 文件结构
```
frontend/
├── js/
│   ├── sales.js          # 销售统计模块主文件
│   ├── api.js            # API调用(新增销售相关接口)
│   ├── app.js            # 导航事件(新增销售统计按钮)
│   └── auth.js           # 登录状态(显示/隐藏销售统计)
├── css/
│   └── style.css         # 销售统计样式(新增约400行)
└── index.html            # 引入sales.js和nav-sales按钮
```

#### 核心函数

**`showSalesStatistics()`**
- 主入口函数,渲染销售统计页面
- 创建标签页切换界面
- 默认加载数据概览

**`loadOverviewTab()`**
- 加载数据概览标签
- 显示统计卡片、状态分布、趋势图、热销商品

**`loadOrdersTab()`**
- 加载订单管理标签
- 订单列表展示、筛选功能
- 发货按钮事件处理

**`loadProductsTab()`**
- 加载商品销售标签
- 商品销售排行榜表格

**`renderTrendChart(data)`**
- 渲染销售趋势条形图
- 根据数据动态计算柱状图宽度

#### API调用封装

```javascript
// 获取商家订单列表
fetchSellerOrders(status, startDate, endDate)

// 获取销售统计数据
fetchSalesStatistics(period)

// 获取商品销售详情
fetchProductSalesDetail(productId)
```

---

## 🎨 样式设计

### 设计元素

1. **玻璃态卡片**: 半透明背景 + 模糊效果
2. **渐变色**: 主色 #10b981 → 次色 #3b82f6
3. **悬停效果**: 卡片上浮 + 阴影增强
4. **Orbitron字体**: 数字和标题使用科技感字体
5. **响应式布局**: 移动端自适应

### 关键CSS类

- `.stats-cards`: 统计卡片网格布局
- `.stat-card`: 单个统计卡片样式
- `.sales-tabs`: 标签页切换按钮组
- `.chart-bar-group`: 趋势图条形组
- `.order-card`: 订单卡片
- `.sales-table`: 销售排行表格
- `.rank-badge`: 排名徽章(金银铜)

---

## 📝 使用流程

### 商家操作流程

1. **登录系统**
   - 使用商家账号登录
   - 导航栏自动显示"销售统计"按钮

2. **查看数据概览**
   - 点击"销售统计"进入页面
   - 默认显示数据概览标签
   - 查看总销售额、订单数等关键指标
   - 查看热销商品Top 10

3. **管理订单**
   - 切换到"订单管理"标签
   - 查看所有购买你商品的订单
   - 使用筛选功能按状态/日期查询
   - 对已支付订单点击"安排发货"
   - 输入快递单号和快递公司
   - 系统自动发送发货通知邮件给买家

4. **查看商品销售**
   - 切换到"商品销售"标签
   - 查看商品销售排行榜
   - 分析哪些商品最受欢迎

---

## 🔐 权限控制

### 数据安全
- 所有API接口验证 `seller_id` 参数
- SQL查询通过 `products.user_id` 关联确保只查询商家自己的数据
- 前端从 `localStorage` 获取当前用户ID

### 访问控制
- 未登录用户: 隐藏"销售统计"导航按钮
- 登录后: 显示"销售统计"按钮,允许访问
- 页面内检查: `showSalesStatistics()` 函数检查登录状态

---

## 📊 数据统计说明

### 统计规则

1. **销售额统计**: 只统计状态为"已支付"、"已发货"、"已完成"的订单
2. **订单关联**: 通过 `order_items` → `products.user_id` 关联
3. **商品归属**: 只统计 `products.user_id = 当前商家ID` 的商品
4. **混合订单**: 如果订单包含多个商家的商品,每个商家只能看到自己商品的部分

### 时间周期

- **day**: 最近24小时,按小时统计
- **week**: 最近7天,按天统计
- **month**: 最近30天,按天统计(默认)
- **year**: 最近12个月,按月统计

---

## 🚀 部署说明

### 后端部署

1. **文件位置**:
   - `backend/controllers/salesController.js`
   - `backend/routes/sales.js`

2. **路由注册**:
   ```javascript
   // backend/app.js
   const salesRoutes = require('./routes/sales');
   app.use('/api/sales', salesRoutes);
   ```

3. **数据库要求**:
   - `products` 表必须有 `user_id` 字段
   - 运行迁移: `node backend/migrations/add_product_user_id.sql`

### 前端部署

1. **文件位置**:
   - `frontend/js/sales.js`
   - `frontend/css/style.css` (新增销售统计样式)

2. **引入脚本**:
   ```html
   <!-- index.html -->
   <script src="js/sales.js"></script>
   ```

3. **导航按钮**:
   ```html
   <a href="#" id="nav-sales" class="nav-link" style="display:none;">
     <span>销售统计</span>
   </a>
   ```

---

## 🐛 常见问题

### Q1: 销售统计显示为0?
**A**: 确保:
1. `products` 表的 `user_id` 字段已正确填充
2. 有已支付/已发货/已完成状态的订单
3. 商品归属正确(通过商品管理页面发布的商品)

### Q2: 订单列表为空?
**A**: 检查:
1. 是否有买家购买了你的商品
2. SQL查询的 `products.user_id` 关联是否正确
3. 浏览器控制台是否有API错误

### Q3: 趋势图不显示?
**A**: 
1. 检查 `stats.trend` 数据是否为空
2. 确保有最近30天内的已支付订单
3. 检查浏览器控制台CSS样式是否加载

---

## 📈 未来优化

### 功能增强
- [ ] 导出销售报表(Excel/PDF)
- [ ] 更多图表类型(折线图、饼图)
- [ ] 销售预测分析
- [ ] 库存预警提醒
- [ ] 客户复购率分析

### 性能优化
- [ ] 数据缓存机制
- [ ] 分页加载订单列表
- [ ] 图表数据懒加载
- [ ] SQL查询优化(添加索引)

---

## 📞 技术支持

如有问题,请查看:
- 浏览器控制台错误信息
- 后端日志 `console.log`
- 数据库查询结果

---

**版本**: v1.0.0  
**最后更新**: 2025-11-20  
**开发团队**: FBI Team
