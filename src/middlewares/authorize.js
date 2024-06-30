const { AppError } = require('./errorHandler');
const User = require('../models/User');

const authorize = (requiredPermissions) => {

  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);
  
      if (!user) {
        return next(new AppError('Usuário não encontrado.', 404));
      }

      // Verifique se o usuário é 'user' e se está tentando acessar suas próprias informações
      if (user.role === 'user' && userId === req.params.userId) {
        return next(); // Permite acesso
      }
  
      // Verifique se o usuário tem uma das permissões necessárias
      const hasPermission = requiredPermissions.includes(user.role);
  
      if (!hasPermission) {
        return next(new AppError('Acesso negado. Permissões insuficientes.', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
