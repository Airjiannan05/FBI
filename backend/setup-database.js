const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('========================================');
  console.log('📦 开始配置支付功能数据库...');
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
    console.log('🔍 检查 orders 表是否存在...');
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'orders'"
    );
    
    if (tables.length === 0) {
      console.log('❌ orders 表不存在！');
      console.log('💡 提示：请先启动后端服务创建基础表，或手动创建 orders 表\n');
      return;
    }
    console.log('✅ orders 表存在\n');

    // 添加字段的函数
    async function addColumnIfNotExists(columnName, columnDefinition, comment) {
      try {
        // 检查字段是否存在
        const [columns] = await connection.query(
          `SHOW COLUMNS FROM orders LIKE '${columnName}'`
        );
        
        if (columns.length > 0) {
          console.log(`⏭️  字段 ${columnName} 已存在，跳过`);
          return false;
        }
        
        // 添加字段
        await connection.query(
          `ALTER TABLE orders ADD COLUMN ${columnName} ${columnDefinition} COMMENT '${comment}'`
        );
        console.log(`✅ 成功添加字段: ${columnName}`);
        return true;
      } catch (error) {
        console.error(`❌ 添加字段 ${columnName} 失败:`, error.message);
        return false;
      }
    }

    // 添加所有支付相关字段
    console.log('📝 开始添加支付和物流相关字段...\n');
    
    let addedCount = 0;
    
    if (await addColumnIfNotExists('payment_method', 'VARCHAR(50)', '支付方式')) addedCount++;
    if (await addColumnIfNotExists('payment_time', 'DATETIME', '支付时间')) addedCount++;
    if (await addColumnIfNotExists('tracking_number', 'VARCHAR(100)', '物流单号')) addedCount++;
    if (await addColumnIfNotExists('carrier', 'VARCHAR(100)', '物流公司')) addedCount++;
    if (await addColumnIfNotExists('shipped_at', 'DATETIME', '发货时间')) addedCount++;

    console.log('\n' + '='.repeat(40));
    if (addedCount > 0) {
      console.log(`✨ 成功添加 ${addedCount} 个新字段！`);
    } else {
      console.log('ℹ️  所有字段已存在，无需添加');
    }
    console.log('='.repeat(40) + '\n');

    // 显示最终的表结构
    console.log('📋 当前 orders 表结构：\n');
    const [structure] = await connection.query('DESC orders');
    console.table(structure.map(col => ({
      字段: col.Field,
      类型: col.Type,
      是否为空: col.Null,
      说明: col.Comment || '无'
    })));

    console.log('\n🎉 数据库配置完成！');
    console.log('\n💡 下一步：');
    console.log('   1. 运行: npm run dev');
    console.log('   2. 访问: http://localhost:3000');
    console.log('   3. 测试支付功能\n');

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
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 运行配置
setupDatabase();
