@echo off
chcp 65001 >nul
echo ========================================
echo 支付功能快速测试
echo ========================================
echo.

echo [步骤 1/3] 检查配置文件...
if not exist ".env" (
    echo ❌ 错误：.env 文件不存在
    echo 请确保 backend/.env 文件存在
    pause
    exit /b 1
)
echo ✓ 配置文件存在

echo.
echo [步骤 2/3] 检查数据库连接...
echo ⚠️  请确保已执行 setup_payment.sql 添加支付字段
echo    可以在 MySQL Workbench 中打开并执行该文件
echo.
pause

echo.
echo [步骤 3/3] 启动服务器...
echo.
echo 服务启动后，请访问: http://localhost:3000
echo.
echo 测试流程:
echo 1. 注册/登录用户（使用真实邮箱）
echo 2. 添加商品到购物车
echo 3. 点击"立即结算"创建订单
echo 4. 点击"立即支付"按钮
echo 5. 检查邮箱是否收到订单确认邮件
echo.
echo ========================================
echo 按 Ctrl+C 停止服务器
echo ========================================
echo.

npm run dev
