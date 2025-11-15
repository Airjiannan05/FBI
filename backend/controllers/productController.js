const pool = require('../config/db');

/**
 * 查询商品列表
 * @route GET /api/product
 * @returns {Array} products 商品数组
 */
exports.list = async (req, res) => {
  try {
    const [products] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ products });
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
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
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
 */
exports.create = async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  if (!name || !price) {
    return res.status(400).json({ message: '商品名和价格必填' });
  }
  try {
    await pool.query(
      'INSERT INTO products (name, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, description || '', price, stock || 0, image_url || '']
    );
    res.json({ message: '商品添加成功' });
  } catch (err) {
    res.status(500).json({ message: '商品添加失败', error: err.message });
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
 */
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, image_url } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE id=?',
      [name, description, price, stock, image_url, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json({ message: '商品更新成功' });
  } catch (err) {
    res.status(500).json({ message: '商品更新失败', error: err.message });
  }
};

/**
 * 删除商品
 * @route DELETE /api/product/:id
 * @param {number} id 商品ID
 */
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '商品不存在' });
    }
    res.json({ message: '商品删除成功' });
  } catch (err) {
    res.status(500).json({ message: '商品删除失败', error: err.message });
  }
};
