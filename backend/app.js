require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const uploadRoutes = require('./routes/upload');
const salesRoutes = require('./routes/sales');
const categoryRoutes = require('./routes/category');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const recommendRoutes = require('./routes/recommend');
const operationLogger = require('./middleware/operationLogger');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 全局操作日志中间件（记录所有 CUD 操作）
app.use('/api', operationLogger);

// 路由
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/recommend', recommendRoutes);

// 静态文件服务（前端）
app.use('/', express.static('../frontend'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1'; // 明确使用 IPv4

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📂 Serving frontend from: ../frontend`);
});
