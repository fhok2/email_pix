const User = require('../models/User');
const bcrypt = require('bcrypt');

const createUser = async (userData) => {
  // Hash da senha antes de salvar o usuário
  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 12);
  }

  // Adicionando permissões com base no papel
  if (userData.role === 'admin') {
    userData.permissions = ['admin', 'create_payment', 'update_payment', 'delete_payment'];
  } else {
    userData.permissions = ['create_payment'];
  }

  const user = new User(userData);
  await user.save();
  return user;
};

const findUserByEmail = async (email) => {

  return await User.findOne({ email });
};

const updateUser = async (id, userData) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error('Usuário não encontrado.');
  }

  if (userData.password) {
    userData.password = await bcrypt.hash(userData.password, 12);
  }

  Object.assign(user, userData);
  await user.save();

  return user;
};


const atualizarPlano = async (userId, novoPlano) => {
  const user = await User.findById(userId);
  if (!user) {
    return {
      code: 404,
      status: 'error',
      message: 'Usuário não encontrado',
    };
  }

  user.plan = novoPlano;
  if (novoPlano === 'paid') {
    user.paymentDate = new Date();
  }
  await user.save();

  return {
    code: 200,
    status: 'success',
    message: 'Plano atualizado com sucesso',
  };
};

const listarEmailsUsuario = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const user = await User.findById(userId).select({
    createdEmails: { $slice: [skip, limit] },
  });

  if (!user) {
    return {
      code: 404,
      status: 'error',
      message: 'Usuário não encontrado',
    };
  }

 
  const emailStats = await User.aggregate([
    { $match: { _id: user._id } },
    { $unwind: "$createdEmails" },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        ativos: {
          $sum: {
            $cond: [{ $eq: ["$createdEmails.status", "active"] }, 1, 0]
          }
        },
        inativos: {
          $sum: {
            $cond: [{ $eq: ["$createdEmails.status", "inactive"] }, 1, 0]
          }
        },
        deletados: {
          $sum: {
            $cond: [{ $eq: ["$createdEmails.status", "deleted"] }, 1, 0]
          }
        }
      }
    }
  ]);

  const stats = emailStats[0] || { total: 0, ativos: 0, inativos: 0, deletados: 0 };
  const totalPages = Math.ceil(stats.total / limit);

  return {
    code: 200,
    status: 'success',
    data: user.createdEmails,
    stats: {
      total: stats.total,
      ativos: stats.ativos,
      inativos: stats.inativos,
      deletados: stats.deletados
    },
    pagination: {
      totalEmails: stats.total,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
};



module.exports = {
  createUser,
  findUserByEmail,
  updateUser,
  atualizarPlano,
  listarEmailsUsuario,
};
