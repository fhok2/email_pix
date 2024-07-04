// src/middlewares/verifyUserEmail.js
const { verifyToken } = require('../services/authService');
const { AppError } = require('./errorHandler');
const User = require('../models/User'); 

const verifyUserEmail = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const { userEmail } = req.body;

  if (!token) {
    return next(new AppError('Token não fornecido.', 401));
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.email !== userEmail) {
      return next(new AppError('O email fornecido não corresponde ao email associado ao token JWT.', 403));
    }

    // Busca o usuário no banco de dados
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return next(new AppError('Usuário não encontrado.', 404));
    }

    // Verifica se o email do usuário está verificado
    if (!user.emailVerified) {
      return next(new AppError('Email não verificado. Por favor, verifique seu email antes de usar os serviços.', 403));
    }

    req.user = decoded; // Adiciona o payload do token à requisição
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('O token JWT expirou.', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token JWT inválido.', 401));
    }
    return next(new AppError('Falha na autenticação.', 401));
  }
};

module.exports = verifyUserEmail;