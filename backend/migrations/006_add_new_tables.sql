-- ============================================
-- 006: 新增数据采集、画像、类别、推荐相关表
-- 配合课程设计大数据分析和推荐系统需求
-- ============================================

-- 1. 商品类别表
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT '类别名称',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '类别描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品类别表';

-- 插入默认类别
INSERT IGNORE INTO `categories` (`name`, `description`) VALUES
  ('电子产品', '手机、电脑、数码配件等'),
  ('服装鞋帽', '男装、女装、鞋类、帽子等'),
  ('图书音像', '书籍、电子书、音乐、电影等'),
  ('家居生活', '家具、家纺、厨具、日用百货等'),
  ('运动户外', '运动器材、户外装备、健身用品等'),
  ('食品饮料', '零食、饮品、生鲜、保健品等'),
  ('美妆个护', '护肤品、化妆品、个人护理等'),
  ('玩具乐器', '儿童玩具、乐器、模型等');

-- 2. 浏览历史记录表
CREATE TABLE IF NOT EXISTS `browse_history` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT DEFAULT NULL COMMENT '用户ID（未登录可为NULL）',
  `product_id` INT NOT NULL COMMENT '商品ID',
  `category_id` INT DEFAULT NULL COMMENT '商品类别ID（冗余，加速查询）',
  `start_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始浏览时间',
  `duration_seconds` INT DEFAULT 0 COMMENT '停留时长（秒）',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '用户IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_category_id` (`category_id`),
  KEY `idx_start_time` (`start_time`),
  CONSTRAINT `bh_product_fk` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bh_category_fk` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户浏览行为记录表';

-- 3. 用户登录日志表
CREATE TABLE IF NOT EXISTS `user_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `login_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录/操作时间',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(500) DEFAULT NULL COMMENT '浏览器UA',
  `action` ENUM('login','logout') DEFAULT 'login' COMMENT '操作类型',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_login_time` (`login_time`),
  KEY `idx_action` (`action`),
  CONSTRAINT `ul_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户登录日志表';

-- 4. 操作日志表（销售人员 & 管理者）
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '操作者ID',
  `operation_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  `operation_type` VARCHAR(50) NOT NULL COMMENT '操作类型（add_product/delete_product/update_product等）',
  `content` VARCHAR(500) DEFAULT NULL COMMENT '操作内容描述',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '操作IP',
  `target_type` VARCHAR(50) DEFAULT NULL COMMENT '操作目标类型（product/order/user等）',
  `target_id` INT DEFAULT NULL COMMENT '操作目标ID',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_operation_time` (`operation_time`),
  KEY `idx_operation_type` (`operation_type`),
  KEY `idx_target` (`target_type`, `target_id`),
  CONSTRAINT `ol_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表（销售人员和管理者）';

-- 5. 用户画像表
CREATE TABLE IF NOT EXISTS `user_profile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `region` VARCHAR(100) DEFAULT NULL COMMENT '地域（基于IP解析）',
  `purchasing_power` ENUM('low','medium','high') DEFAULT NULL COMMENT '购买力等级',
  `preference_category` VARCHAR(500) DEFAULT NULL COMMENT '偏好分类（文字描述）',
  `total_spent` DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计消费金额',
  `order_count` INT DEFAULT 0 COMMENT '订单总数',
  `avg_order_value` DECIMAL(10,2) DEFAULT 0.00 COMMENT '平均客单价',
  `favorite_categories` JSON DEFAULT NULL COMMENT '偏好类别JSON: [{"id":1,"name":"电子产品","count":5}]',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最近登录IP',
  `browse_count` INT DEFAULT 0 COMMENT '总浏览次数',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `up_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户画像表';

-- ============================================
-- 补充：更新 products 表，为现有 category 字段创建外键关联
-- ============================================
-- 注意：如果 products 表中已有 category 字段但值不是数字ID，
-- 需要先做数据迁移。这里假设 category 字段将用于存储 categories.id
