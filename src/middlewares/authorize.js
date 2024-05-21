// src/middlewares/authorize.js

const { AppError } = require('./errorHandler');
const User = require('../models/User');

const authorize = (requiredPermissions) => {
  return async (req, res, next) => {
    const userId = req.user.id;
    const user = await User.findById(userId);



    if (!user) {
      return next(new AppError('Usuário não encontrado.', 404));
    }

    const hasPermission = requiredPermissions.every(permission => 
      user.role.includes(permission)
    );

    if (!hasPermission) {
      return next(new AppError('Acesso negado. Permissões insuficientes.', 403));
    }

    next();
  };
};

module.exports = authorize;
