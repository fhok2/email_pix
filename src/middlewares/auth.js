// src/middlewares/auth.js
const { verifyToken } = require('../services/authService');
const { AppError } = require('./errorHandler');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return next(new AppError('Token não fornecido.', 401));
  }

  try {
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return next(new AppError('Usuário não encontrado.', 401));
    }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado.', 401));
    }
    return next(new AppError('Autenticação falhou.', 401));
  }
};

module.exports = authenticate;
