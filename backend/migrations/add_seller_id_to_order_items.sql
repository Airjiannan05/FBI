-- 为 order_items 表添加 seller_id 字段
-- 这样可以直接查询某个卖家的所有订单项,无需多表JOIN

ALTER TABLE order_items 
ADD COLUMN seller_id INT DEFAULT NULL COMMENT '商品卖家ID' AFTER product_id;

-- 为现有数据填充 seller_id (从 products 表获取)
UPDATE order_items oi
INNER JOIN products p ON oi.product_id = p.id
SET oi.seller_id = p.user_id
WHERE p.user_id IS NOT NULL;

-- 添加索引以提高查询性能
CREATE INDEX idx_seller_id ON order_items(seller_id);

-- 查看更新结果
SELECT '更新完成！order_items 表现在包含 seller_id 字段' as message;
SELECT COUNT(*) as total_items, COUNT(seller_id) as items_with_seller FROM order_items;
