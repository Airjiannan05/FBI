-- 支付功能数据库配置
-- 请在MySQL Workbench或命令行中执行此文件

USE shopping_db;

-- 添加支付方式字段
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) COMMENT '支付方式';

-- 添加支付时间字段
ALTER TABLE orders ADD COLUMN payment_time DATETIME COMMENT '支付时间';

-- 添加物流单号字段
ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(100) COMMENT '物流单号';

-- 添加物流公司字段
ALTER TABLE orders ADD COLUMN carrier VARCHAR(100) COMMENT '物流公司';

-- 添加发货时间字段
ALTER TABLE orders ADD COLUMN shipped_at DATETIME COMMENT '发货时间';

-- 查看订单表结构确认
DESC orders;

-- 显示成功信息
SELECT '✓ 数据库字段添加成功！' AS status;
