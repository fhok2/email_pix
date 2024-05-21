// src/middlewares/isAdmin.js
const { AppError } = require('./errorHandler');

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(new AppError('Acesso negado.', 403));
  }
  next();
};

module.exports = isAdmin;
