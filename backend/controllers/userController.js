const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

/**
 * 用户注册接口
 * @route POST /api/user/register
 * @param {string} username
 * @param {string} password
 * @param {string} email
 */

exports.register = async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    // 检查用户名或邮箱是否已存在
    const [users] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (users.length > 0) {
      return res.status(409).json({ message: '用户名或邮箱已存在' });
    }
    // 密码加密
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hash, email]);
    res.json({ message: '注册成功' });
  } catch (err) {
    res.status(500).json({ message: '注册失败', error: err.message });
  }
};

/**
 * 用户登录接口
 * @route POST /api/user/login
 * @param {string} username
 * @param {string} password
 * @returns {string} token 登录成功返回JWT
 */

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    // 查找用户
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    const user = users[0];
    // 校验密码
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    // 生成JWT
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: '登录成功', token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: '登录失败', error: err.message });
  }
};

/**
 * 用户注销接口（前端只需清除本地token即可）
 * @route POST /api/user/logout
 */
exports.logout = (req, res) => {
  // JWT无服务端会话，前端清除token即可
  res.json({ message: '注销成功' });
};

/**
 * 获取用户信息接口
 * @route GET /api/user/profile
 * @header {string} Authorization Bearer token
 */

exports.profile = async (req, res) => {
  // 从请求头获取token
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录' });
  }
  const token = auth.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 查询用户信息
    const [users] = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json({ user: users[0] });
  } catch (err) {
    res.status(401).json({ message: 'token无效或已过期' });
  }
};
