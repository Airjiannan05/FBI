const pool = require('../config/db');

/**
 * 获取所有类别
 * @route GET /api/category
 */
exports.list = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: '查询类别失败', error: err.message });
  }
};

/**
 * 添加类别
 * @route POST /api/category
 */
exports.create = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: '类别名称不能为空' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ message: '类别已存在' });
    }
    const [result] = await pool.query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name.trim(), description || null]
    );
    res.json({ message: '类别添加成功', id: result.insertId });
  } catch (err) {
    res.status(500).json({ message: '添加类别失败', error: err.message });
  }
};

/**
 * 更新类别
 * @route PUT /api/category/:id
 */
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    if (name) {
      const [existing] = await pool.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name.trim(), id]);
      if (existing.length > 0) {
        return res.status(409).json({ message: '类别名称已存在' });
      }
    }
    const [result] = await pool.query(
      'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description) WHERE id = ?',
      [name || null, description !== undefined ? description : null, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '类别不存在' });
    }
    res.json({ message: '类别更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新类别失败', error: err.message });
  }
};

/**
 * 删除类别
 * @route DELETE /api/category/:id
 */
exports.remove = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    
    // 检查是否有商品关联
    const [products] = await conn.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [id]);
    if (products[0].count > 0) {
      await conn.rollback();
      return res.status(400).json({ message: `该类别下有 ${products[0].count} 个商品，无法删除` });
    }
    
    const [result] = await conn.query('DELETE FROM categories WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: '类别不存在' });
    }
    
    await conn.commit();
    res.json({ message: '类别删除成功' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ message: '删除类别失败', error: err.message });
  } finally {
    conn.release();
  }
};
