const pool = require('../config/db');

/**
 * 查询商品列表（支持搜索）
 * @route GET /api/product
 * @query {string} search - 搜索关键词（可选）
 * @returns {Array} products 商品数组
 */
exports.list = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `SELECT p.*, c.name AS category_name FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id`;
    let params = [];
    
    // 如果有搜索关键词，添加搜索条件
    if (search && search.trim()) {
      query += ' WHERE p.name LIKE ? OR p.description LIKE ?';
      const searchPattern = `%${search.trim()}%`;
      params = [searchPattern, searchPattern];
    }
    
    query += ' ORDER BY p.created_at DESC';
    
    const [products] = await pool.query(query, params);
    res.json({ products, search: search || '' });
  } catch (err) {
    res.status(500).json({ message: '查询商品失败', error: err.message });
  }
};

/**
 * 查询商品详情
 * @route GET /api/product/:id
 * @param {number} id 商品ID
 * @returns {Object} 商品详情
 */
exports.detail = async (req, res) => {
  const { id } = req.params;
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`, [id]
    );
    if (products.length === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json({ product: products[0] });
  } catch (err) {
    res.status(500).json({ message: '查询商品详情失败', error: err.message });
  }
};

/**
 * 新增商品
 * @route POST /api/product
 * @param {string} name
 * @param {string} description
 * @param {number} price
 * @param {number} stock
 * @param {string} image_url
 * @param {number} user_id - 发布者用户ID
 * @param {number} category_id - 类别ID（可选）
 */
exports.create = async (req, res) => {
  const { name, description, price, stock, image_url, user_id, category_id } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: '商品名和价格必填' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, stock, image_url, user_id, category_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description || '', price, stock || 0, image_url || '', user_id || null, category_id || null]
    );
    res.json({ message: '商品创建成功', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '商品添加失败', error: err.message });
  }
};

/**
 * 查询用户的商品列表
 * @route GET /api/product/my
 * @query {number} user_id - 用户ID
 * @returns {Array} products 用户发布的商品数组
 */
exports.myProducts = async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) {
    return res.status(400).json({ message: '缺少用户ID' });
  }
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = ? ORDER BY p.created_at DESC`,
      [user_id]
    );
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: '查询商品失败', error: err.message });
  }
};

/**
 * 更新商品
 * @route PUT /api/product/:id
 * @param {number} id 商品ID
 * @param {string} name
 * @param {string} description
 * @param {number} price
 * @param {number} stock
 * @param {string} image_url
 * @param {number} category_id - 类别ID（可选）
 */
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url, category_id } = req.body;
  try {
    // 构建动态更新语句（只更新提供的字段）
    let updateFields = [];
    let updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name=?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description=?');
      updateValues.push(description);
    }
    if (price !== undefined) {
      updateFields.push('price=?');
      updateValues.push(price);
    }
    if (stock !== undefined) {
      updateFields.push('stock=?');
      updateValues.push(stock);
    }
    if (image_url !== undefined) {
      updateFields.push('image_url=?');
      updateValues.push(image_url);
    }
    if (category_id !== undefined) {
      updateFields.push('category_id=?');
      updateValues.push(category_id || null);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: '没有要更新的字段' });
    }
    
    updateValues.push(id);
    const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id=?`;
    
    const [result] = await pool.query(sql, updateValues);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json({ message: '商品更新成功' });
  } catch (err) {
    res.status(500).json({ message: '商品更新失败', error: err.message });
  }
};

/**
 * 删除商品（改进版 - 检查订单关联）
 * @route DELETE /api/product/:id
 * @param {number} id 商品ID
 */
exports.remove = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // 1. 检查是否有关联的订单
    const [orderItems] = await connection.query(
      'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
      [id]
    );
    
    if (orderItems[0].count > 0) {
      // 如果有关联订单，不允许删除，返回友好提示
      await connection.rollback();
      return res.status(400).json({ 
        message: `该商品已有 ${orderItems[0].count} 笔订单记录，无法删除。建议将库存设为0以停止销售。`
      });
    }
    
    // 2. 如果没有关联订单，执行删除
    const [result] = await connection.query('DELETE FROM products WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: '商品不存在' });
    }
    
    await connection.commit();
    res.json({ message: '商品删除成功' });
    
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ message: '商品删除失败', error: err.message });
  } finally {
    connection.release();
  }
};
