-- 为商品表添加用户ID字段，用于商品管理功能
-- 执行此脚本前，请确保已连接到 shopping_db 数据库

USE shopping_db;

-- 添加 user_id 字段（关联商品发布者）
ALTER TABLE products 
ADD COLUMN user_id INT COMMENT '发布者用户ID' AFTER image_url;

-- 添加外键约束（可选，如果需要严格的关联关系）
-- ALTER TABLE products 
-- ADD CONSTRAINT fk_products_user 
-- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 查看修改后的表结构
DESC products;

-- 显示成功消息
SELECT '✓ 商品表 user_id 字段添加成功！' AS message;
