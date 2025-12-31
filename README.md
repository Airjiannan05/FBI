# 🛍️ FBI 购物网站项目-23网络工程-陈建霖-202330450231

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0-orange.svg)
![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)

**一个功能完整的现代化电商平台**

[快速开始](#-快速开始) • [功能特性](#-主要功能) • [技术栈](#-技术栈) • [目录结构](#-目录结构)

</div>

---

## 📋 目录

- [技术栈](#-技术栈)
- [目录结构](#-目录结构)
- [快速开始](#-快速开始)
- [主要功能](#-主要功能)
- [环境配置](#-环境配置)
- [开发文档](#-开发文档)

---

## 🚀 技术栈

### 前端技术
- **核心**: HTML5 + CSS3 + JavaScript (ES6+)
- **样式**: 
  - 玻璃态设计 (Glassmorphism)
  - 霓虹灯效果 (Neon Effects)
  - 响应式布局
  - Particles.js 粒子背景
- **架构**: 模块化 JavaScript (无框架)

### 后端技术
- **运行时**: Node.js (v14+)
- **框架**: Express.js
- **数据库**: MySQL 8.0
- **认证**: JWT (JSON Web Tokens)
- **加密**: bcrypt
- **文件上传**: Multer + 阿里云 OSS
- **邮件服务**: Nodemailer (SMTP)
- **跨域**: CORS

### 开发工具
- **热重载**: Nodemon
- **环境变量**: dotenv
- **版本控制**: Git

---

## 📁 目录结构

```
FBI/
│
├── 📂 backend/                      # 后端服务
│   ├── 📂 config/                   # 配置文件
│   │   └── db.js                    # MySQL 数据库连接配置
│   │
│   ├── 📂 controllers/              # 控制器层
│   │   ├── authController.js        # 用户认证控制器(注册/登录)
│   │   ├── cartController.js        # 购物车控制器
│   │   ├── orderController.js       # 订单控制器
│   │   ├── paymentController.js     # 支付控制器(支付宝/微信/银行卡)
│   │   ├── productController.js     # 商品控制器(CRUD/搜索)
│   │   └── uploadController.js      # 文件上传控制器(OSS)
│   │
│   ├── 📂 routes/                   # 路由层
│   │   ├── auth.js                  # 认证路由
│   │   ├── cart.js                  # 购物车路由
│   │   ├── order.js                 # 订单路由
│   │   ├── payment.js               # 支付路由
│   │   ├── product.js               # 商品路由
│   │   └── upload.js                # 上传路由
│   │
│   ├── 📂 models/                   # 数据模型层
│   │   └── db.sql                   # 数据库表结构
│   │
│   ├── 📂 utils/                    # 工具函数
│   │   ├── emailService.js          # 邮件服务
│   │   └── ossClient.js             # 阿里云 OSS 客户端
│   │
│   ├── 📂 migrations/               # 数据库迁移
│   │   └── add_product_user_id.sql  # 商品管理功能迁移
│   │
│   ├── 📄 app.js                    # 应用入口
│   ├── 📄 package.json              # 项目依赖配置
│   ├── 📄 .env.example              # 环境变量示例
│   ├── 📄 setup-database.js         # 数据库初始化脚本
│   └── 📄 setup-product-manage.js   # 商品管理设置脚本
│
├── 📂 frontend/                     # 前端静态资源
│   ├── 📂 js/                       # JavaScript 模块
│   │   ├── api.js                   # API 接口封装
│   │   ├── app.js                   # 应用主入口
│   │   ├── auth.js                  # 认证模块(登录/注册/注销)
│   │   ├── cart.js                  # 购物车逻辑
│   │   ├── cartPage.js              # 购物车页面
│   │   ├── orders.js                # 订单管理
│   │   ├── products.js              # 商品列表与详情
│   │   ├── productManage.js         # 商品管理(卖家功能)
│   │   ├── sell.js                  # 发布商品
│   │   └── utils.js                 # 工具函数
│   │
│   ├── 📂 css/                      # 样式文件
│   │   └── style.css                # 主样式(1700+ 行)
│   │
│   ├── 📂 images/                   # 图片资源
│   │
│   ├── 📄 index.html                # 主页面
│   └── 📄 upload.html               # 上传测试页面
│
├── 📂 docs/                         # 文档目录
│   ├── Frontend_Update_Log0.md      # 前端更新日志 0
│   ├── Frontend_Update_Log1.md      # 前端更新日志 1
│   ├── PRODUCT_MANAGE.md            # 商品管理功能文档
│   ├── PRODUCT_MANAGE_FIX.md        # 商品管理修复文档
│   ├── QUICKSTART.md                # 快速开始指南
│   └── 支付功能开发文档.md          # 支付功能文档
│
├── 📄 README.md                     # 项目说明文档
└── 📄 .gitignore                    # Git 忽略配置
```

### 🎯 关键目录说明

| 目录 | 说明 | 关键文件 |
|------|------|----------|
| `backend/controllers/` | 业务逻辑层 | 处理所有业务逻辑和数据操作 |
| `backend/routes/` | 路由定义层 | RESTful API 路由配置 |
| `frontend/js/` | 前端模块 | 模块化的客户端逻辑 |
| `frontend/css/` | 样式表 | 玻璃态设计和霓虹效果 |
| `config/` | 配置文件 | 数据库、邮件、OSS 等配置 |

---

## 🎯 主要功能

### 👤 用户功能
- ✅ **用户注册** - 邮箱验证、密码加密
- ✅ **用户登录** - JWT Token 认证
- ✅ **自动登录** - Token 持久化
- ✅ **用户注销** - 清除认证信息

### 🛒 购物功能
- ✅ **商品浏览** - 网格卡片布局、响应式设计
- ✅ **商品搜索** - 实时搜索商品名称和描述
- ✅ **商品详情** - 弹窗展示详细信息
- ✅ **购物车** - 添加/删除商品、数量调整
- ✅ **订单创建** - 一键下单、地址填写
- ✅ **订单管理** - 查看订单历史、跟踪状态

### 🏪 卖家功能
- ✅ **发布商品** - 支持图片上传(阿里云 OSS)
- ✅ **商品管理** - 查看/编辑/删除自己发布的商品
- ✅ **库存管理** - 实时库存状态显示
- ✅ **图片管理** - 点击/拖拽上传图片

### 💳 支付功能
- ✅ **支付宝支付** - 扫码支付
- ✅ **微信支付** - 扫码支付
- ✅ **银行卡支付** - 在线支付
- ✅ **支付验证** - 支付状态跟踪

### 📧 通知功能
- ✅ **邮件通知** - 订单确认、发货通知
- ✅ **实时提示** - Toast 消息提示

---

## ⚡ 快速开始

### 前置要求

- Node.js >= 14.0.0
- MySQL >= 8.0
- npm 或 yarn

### 安装步骤

#### 1️⃣ 克隆项目

```bash
git clone <repository-url>
cd FBI
```

#### 2️⃣ 安装后端依赖

```bash
cd backend
npm install
```

#### 3️⃣ 配置环境变量

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，配置以下信息：
# - 数据库连接信息
# - JWT 密钥
# - 阿里云 OSS 配置
# - 邮件服务配置
```

#### 4️⃣ 初始化数据库

```bash
# 运行数据库初始化脚本
node setup-database.js

# 运行商品管理功能迁移
node setup-product-manage.js
```

#### 5️⃣ 启动后端服务

```bash
# 开发模式(热重载)
npm run dev

# 生产模式
npm start
```

#### 6️⃣ 访问应用

打开浏览器访问: `http://localhost:3000`

---

## 🔧 环境配置

### `.env` 配置项

```env
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=shopping_site

# JWT 配置
JWT_SECRET=your_jwt_secret_key

# 服务器配置
PORT=3000

# 阿里云 OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name

# 邮件服务配置
EMAIL_HOST=smtp.example.com
EMAIL_PORT=465
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

---

## 📚 开发文档

- [快速开始指南](QUICKSTART.md) - 详细的安装和配置步骤
- [商品管理功能](PRODUCT_MANAGE.md) - 商品管理功能文档
- [商品管理修复](PRODUCT_MANAGE_FIX.md) - 按钮显示问题修复
- [支付功能文档](支付功能开发文档.md) - 支付功能详细说明
- [前端更新日志](Frontend_Update_Log0.md) - 前端功能迭代记录

---

## 🎨 界面预览

- **玻璃态设计** (Glassmorphism)
- **霓虹灯效果** (Neon Button Effects)
- **粒子背景** (Particles.js)
- **响应式布局** (Mobile-First Design)
- **流畅动画** (CSS Transitions & Animations)

---

## 🔐 安全特性

- ✅ 密码 bcrypt 加密存储
- ✅ JWT Token 认证
- ✅ SQL 注入防护 (Prepared Statements)
- ✅ XSS 防护
- ✅ CORS 跨域配置
- ✅ 文件上传类型验证

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

---

## 📄 许可证

MIT License

---

## 📞 联系方式

如有问题,请提交 Issue 或联系开发团队。

---

<div align="center">

**⭐ 如果觉得项目不错,请给个 Star! ⭐**

Made with ❤️ by FBI Team

</div>

