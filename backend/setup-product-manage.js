const mysql = require('mysql2/promise');
require('dotenv').config();

async function addProductUserId() {
  console.log('========================================');
  console.log('📦 开始配置商品管理功能数据库...');
  console.log('========================================\n');

  let connection;
  
  try {
    // 创建数据库连接
    console.log('🔌 正在连接到数据库...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'shopping_db'
    });
    console.log('✅ 数据库连接成功\n');

    // 检查表是否存在
    console.log('🔍 检查 products 表是否存在...');
    const [tables] = await connection.query("SHOW TABLES LIKE 'products'");
    
    if (tables.length === 0) {
      console.log('❌ products 表不存在！');
      console.log('💡 提示：请先启动后端服务创建基础表\n');
      return;
    }
    console.log('✅ products 表存在\n');

    // 检查字段是否已存在
    console.log('🔍 检查 user_id 字段是否存在...');
    const [columns] = await connection.query("SHOW COLUMNS FROM products LIKE 'user_id'");
    
    if (columns.length > 0) {
      console.log('⏭️  user_id 字段已存在，无需添加\n');
      
      // 显示当前表结构
      console.log('📋 当前 products 表结构：\n');
      const [structure] = await connection.query('DESC products');
      console.table(structure.map(col => ({
        字段: col.Field,
        类型: col.Type,
        是否为空: col.Null,
        键: col.Key,
        默认值: col.Default,
        说明: col.Comment || '无'
      })));
      return;
    }

    // 添加 user_id 字段
    console.log('📝 正在添加 user_id 字段...\n');
    await connection.query(
      "ALTER TABLE products ADD COLUMN user_id INT COMMENT '发布者用户ID' AFTER image_url"
    );
    console.log('✅ 成功添加 user_id 字段！\n');

    // 显示最终的表结构
    console.log('📋 更新后的 products 表结构：\n');
    const [structure] = await connection.query('DESC products');
    console.table(structure.map(col => ({
      字段: col.Field,
      类型: col.Type,
      是否为空: col.Null,
      键: col.Key,
      默认值: col.Default,
      说明: col.Comment || '无'
    })));

    console.log('\n🎉 商品管理功能数据库配置完成！');
    console.log('\n💡 下一步：');
    console.log('   1. 重启后端服务: npm run dev');
    console.log('   2. 登录后点击"商品管理"按钮');
    console.log('   3. 开始管理您的商品\n');

  } catch (error) {
    console.error('\n❌ 配置失败:', error.message);
    console.error('\n💡 可能的原因:');
    console.error('   - 数据库连接失败（检查 .env 配置）');
    console.error('   - MySQL 服务未启动');
    console.error('   - 权限不足\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 执行配置
addProductUserId();
