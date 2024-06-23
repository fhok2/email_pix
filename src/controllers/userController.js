const UserService = require('../services/userServices');
const AuthService = require('../services/authService');
const logger = require('../utils/logger');

module.exports = class UserController {
  async register(req, res) {
    const { name, email, password, phone } = req.body;

    try {
      const emailExist = await UserService.findUserByEmail(email);
      if (emailExist) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Não é possivel efetuar cadastro com este email.",
        });
      }
      const user = await UserService.createUser({ name, email, password, phone });

      // Gere tokens após a criação do usuário
      const token = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      // Atualize o usuário com o refresh token
      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({
        code: 201,
        status: "success",
        message: "Usuário cadastrado com sucesso.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          permissions: user.permissions,
        },
        token,
      });
    } catch (error) {
      logger.error('Erro ao cadastrar usuário.', { error });
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao cadastrar usuário.",
        data: error.message,
      });
    }
  }
async update(req, res) {
    const { name,phone } = req.body;
    const { id } = req.params;

    try {
      const user = await UserService.updateUser(id, { name, phone });

      res.status(204).json();
    } catch (error) {
      logger.error('Erro ao atualizar usuário.', { error });
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao atualizar usuário.",
        data: error.message,
      });
    }
  }
  async updatePassword (req, res) {
    const { password } = req.body;
    const { id } = req.params;

    try {
      const user = await UserService.updateUser(id, { password });

      res.status(204).json();
    } catch (error) {
      logger.error('Erro ao atualizar a senha do usuário.', { error });
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao atualizar a senha do usuário.",
        data: error.message,
      });
    }
  }
  // Método para verificar se o email já está cadastrado
  async checkEmail(req, res) {
    const { email } = req.body;
    try {
      const user = await UserService.findUserByEmail(email);
      if (user) {
        return res.status(200).json({
          code: 200,
          status: "success",
          message: "E-mail encontrado.",
        });
      } else {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "E-mail não registrado.",
        });
      }
    } catch (error) {
      logger.error('Erro ao verificar o e-mail.', { error });
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao verificar o e-mail.",
        data: error.message,
      });
    }
  }
};
