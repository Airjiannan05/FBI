# 购物网站项目

## 技术栈
- 前端：HTML + JS + CSS
- 后端：Node.js + Express
- 数据库：MySQL
- 邮件服务：SMTP（nodemailer）

## 目录结构
- backend/  后端服务
- frontend/ 前端静态页面

## 快速开始
1. 配置MySQL数据库，修改 backend/.env
2. 在 backend 目录下安装依赖：
   ```
   npm install
   ```
3. 启动后端服务：
   ```
   npm run dev
   ```
4. 访问 http://localhost:3000 查看前端页面

## 主要功能
- 用户注册/登录/注销
- 商品浏览与管理
- 购物车与下单
- 订单查询
- 邮件通知

## 说明
- 请根据实际部署环境完善.env配置。
