// src/controllers/authController.js

const AuthService = require('../services/authService');
const { generateAndSendPassword } = require('../services/passwordService');
const logger = require('../utils/logger');

module.exports = class AuthController {
  async sendPassword(req, res) {
    const { email } = req.body;
    try {
      const response = await generateAndSendPassword(email);
      if (response.code === 404) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: response.message,
        });
      }
      res.status(200).json({
        code: 200,
        status: "success",
        message: "Senha enviada para o e-mail.",
      });
    } catch (error) {
      logger.error('Erro ao enviar a senha.', { error });
      console.error(error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao enviar a senha.",
        data: error,
      });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;
    try {
      const user = await AuthService.findUserByEmail(email);
      if (user && await AuthService.comparePassword(password, user.password)) {
        const token = AuthService.generateToken(user);
        const refreshToken = AuthService.generateRefreshToken(user);
        
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // Apenas HTTPS em produção
          sameSite: 'strict', // Protege contra navegação cruzada
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });

        res.status(200).json({
          code: 200,
          status: "success",
          message: "Login bem-sucedido.",
          token,
        });
      } else {
        res.status(400).json({
          code: 400,
          status: "error",
          message: "Senha inválida.",
        });
      }
    } catch (error) {
      logger.error('Erro ao validar a senha.', { error });
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao validar a senha.",
        data: error,
      });
    }
  }

  async refreshToken(req, res) {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Refresh token não fornecido.",
      });
    }

    try {
      const { newAccessToken, newRefreshToken } = await AuthService.renewTokens(refreshToken);

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        code: 200,
        status: "success",
        token: newAccessToken,
      });
    } catch (error) {
      res.status(403).json({
        code: 403,
        status: "error",
        message: "Erro ao renovar os tokens.",
        data: error.message,
      });
    }
  }

  async logout(req, res) {
    try {
      const { email } = req.user;

      const user = await AuthService.findUserByEmail(email);
      user.refreshToken = null;
      await user.save();

      res.clearCookie('refreshToken');

      res.status(200).json({ message: 'Logout bem-sucedido.' });
    } catch (error) {
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao realizar logout.",
        data: error.message,
      });
    }
  }
};
