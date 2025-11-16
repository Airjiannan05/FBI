-- 为订单表添加支付和物流相关字段
-- 使用前请确保已连接到 shopping_db 数据库

USE shopping_db;

-- 检查并添加支付方式字段
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'shopping_db' 
               AND TABLE_NAME = 'orders' 
               AND COLUMN_NAME = 'payment_method');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) COMMENT "支付方式"', 
                   'SELECT "payment_method already exists" AS msg');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加支付时间字段
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'shopping_db' 
               AND TABLE_NAME = 'orders' 
               AND COLUMN_NAME = 'payment_time');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE orders ADD COLUMN payment_time DATETIME COMMENT "支付时间"', 
                   'SELECT "payment_time already exists" AS msg');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加物流单号字段
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'shopping_db' 
               AND TABLE_NAME = 'orders' 
               AND COLUMN_NAME = 'tracking_number');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) COMMENT "物流单号"', 
                   'SELECT "tracking_number already exists" AS msg');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加物流公司字段
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'shopping_db' 
               AND TABLE_NAME = 'orders' 
               AND COLUMN_NAME = 'carrier');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE orders ADD COLUMN carrier VARCHAR(100) COMMENT "物流公司"', 
                   'SELECT "carrier already exists" AS msg');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加发货时间字段
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = 'shopping_db' 
               AND TABLE_NAME = 'orders' 
               AND COLUMN_NAME = 'shipped_at');
SET @sqlstmt := IF(@exist = 0, 
                   'ALTER TABLE orders ADD COLUMN shipped_at DATETIME COMMENT "发货时间"', 
                   'SELECT "shipped_at already exists" AS msg');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 查看订单表结构
DESC orders;

-- 显示迁移完成信息
SELECT '数据库迁移完成！已添加支付和物流相关字段。' AS 'Migration Status';
