require('dotenv').config({ path: '../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  let connection;
  try {
    // 1. 连接到 MySQL 服务器 (不指定数据库)
    console.log('🔌 Connecting to MySQL server...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      multipleStatements: true // 允许执行多条 SQL 语句
    });

    const dbName = process.env.DB_NAME || 'shopping_db';

    // 2. 创建数据库
    console.log(`🔨 Creating database '${dbName}' if not exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${dbName}\``);

    // 3. 读取并执行 create_tables.sql
    console.log('📄 Reading create_tables.sql...');
    const createTablesSql = fs.readFileSync(path.join(__dirname, 'create_tables.sql'), 'utf8');
    
    console.log('🚀 Executing table creation scripts...');
    await connection.query(createTablesSql);
    console.log('✅ Tables created successfully.');

    // 4. 询问是否导入初始数据 (可选)
    // 这里我们直接检查是否有数据文件，如果有则尝试导入
    const dataFiles = ['users.sql', 'products.sql', 'orders.sql', 'order_items.sql'];
    
    for (const file of dataFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        console.log(`📥 Importing data from ${file}...`);
        const dataSql = fs.readFileSync(filePath, 'utf8');
        if (dataSql.trim()) {
           try {
             await connection.query(dataSql);
             console.log(`   ✅ Imported ${file}`);
           } catch (err) {
             console.warn(`   ⚠️ Warning: Failed to import ${file}. It might contain duplicate data or errors.`);
             console.warn(`   Error: ${err.message}`);
           }
        } else {
            console.log(`   ℹ️ ${file} is empty, skipping.`);
        }
      } else {
        console.log(`   ℹ️ ${file} not found, skipping.`);
      }
    }

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed.');
    }
  }
}

setupDatabase();
