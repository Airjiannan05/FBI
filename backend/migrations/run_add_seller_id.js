const pool = require('../config/db');

async function migrate() {
  try {
    console.log('开始迁移: 为 order_items 表添加 seller_id 字段...\n');
    
    // 1. 添加 seller_id 字段
    console.log('步骤1: 添加字段...');
    await pool.query(`
      ALTER TABLE order_items 
      ADD COLUMN seller_id INT DEFAULT NULL COMMENT '商品卖家ID' AFTER product_id
    `);
    console.log('✅ seller_id 字段添加成功!\n');
    
    // 2. 填充现有数据
    console.log('步骤2: 填充现有数据...');
    const [result] = await pool.query(`
      UPDATE order_items oi
      INNER JOIN products p ON oi.product_id = p.id
      SET oi.seller_id = p.user_id
      WHERE p.user_id IS NOT NULL
    `);
    console.log(`✅ 已更新 ${result.affectedRows} 条记录\n`);
    
    // 3. 添加索引
    console.log('步骤3: 添加索引...');
    await pool.query(`
      CREATE INDEX idx_seller_id ON order_items(seller_id)
    `);
    console.log('✅ 索引创建成功!\n');
    
    // 4. 验证结果
    console.log('验证结果:');
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_items, 
        COUNT(seller_id) as items_with_seller 
      FROM order_items
    `);
    console.table(stats);
    
    const [items] = await pool.query(`
      SELECT oi.id, oi.order_id, oi.product_id, oi.seller_id, p.name 
      FROM order_items oi 
      LEFT JOIN products p ON oi.product_id = p.id 
      LIMIT 10
    `);
    console.log('\n订单项数据示例:');
    console.table(items);
    
    console.log('\n✅ 迁移完成!');
    process.exit(0);
  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
    process.exit(1);
  }
}

migrate();
