require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const userRoutes = require('./routes/user');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/order');
const uploadRoutes = require('./routes/upload');
const salesRoutes = require('./routes/sales');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/user', userRoutes);
app.use('/api/product', productRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sales', salesRoutes);

// 静态文件服务（前端）
app.use('/', express.static('../frontend'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1'; // 明确使用 IPv4

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on http://${HOST}:${PORT}`);
  console.log(`📂 Serving frontend from: ../frontend`);
});
