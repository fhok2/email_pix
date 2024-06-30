const User = require("../models/User");

const listarUsuarios = async () => {
  const users = await User.find({}, 'name email plan paymentDate');
  return {
    code: 200,
    status: 'success',
    data: users,
  };
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

module.exports = {
  listarUsuarios,
  atualizarPlano
};