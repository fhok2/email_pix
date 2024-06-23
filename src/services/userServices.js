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

module.exports = {
  createUser,
  findUserByEmail,
  updateUser
};
