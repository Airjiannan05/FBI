const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.register = async (req, res) => {
  // TODO: 实现注册逻辑
  res.json({ message: '注册接口待实现' });
};

exports.login = async (req, res) => {
  // TODO: 实现登录逻辑
  res.json({ message: '登录接口待实现' });
};

exports.logout = (req, res) => {
  // TODO: 实现注销逻辑
  res.json({ message: '注销接口待实现' });
};

exports.profile = async (req, res) => {
  // TODO: 查询用户信息
  res.json({ message: '用户信息接口待实现' });
};
