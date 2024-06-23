const crypto = require('crypto');
const AuthService = require('../services/authService');
const User = require('../models/User'); 
const { generateAndSendPassword } = require('../services/passwordService');
const { sendEmail } = require('../services/passwordService');
const logger = require('../utils/logger');

module.exports = class AuthController {
  async sendPassword(req, res) {
    const { email } = req.body;
    try {
      const userExists = await AuthService.findUserByEmail(email);
      if (!userExists) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "Usuário não encontrado verifique o email e tente novamente.",
        });
      }
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
      // Verificação dos valores de email e password
      if (!email || !password) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Email e senha são obrigatórios.",
        });
      }

      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Credenciais inválidas.",
        });
      }

      // Verificação dos valores de password e user.password
      if (!user.password) {
        logger.error('A senha do usuário não está definida.', { email: user.email });
        return res.status(500).json({
          code: 500,
          status: "error",
          message: "Erro ao validar a senha. Por favor, tente novamente mais tarde.",
        });
      }

      const isPasswordValid = await AuthService.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Credenciais inválidas.",
        });
      }

      const token = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        code: 200,
        status: "success",
        message: "Login bem-sucedido.",
        token,
      });
    } catch (error) {
      console.error(error);
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
    const refreshToken = req.cookies.refreshToken;
  
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
        sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
  
      res.status(200).json({
        code: 200,
        status: "success",
        token: newAccessToken,
      });
    } catch (error) {
      console.error('Erro ao renovar tokens:', error);
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          code: 401,
          status: "error",
          message: "Refresh token expirado.",
        });
      } else if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
          code: 401,
          status: "error",
          message: "Refresh token inválido.",
        });
      } else {
        res.status(500).json({
          code: 500,
          status: "error",
          message: "Erro ao renovar os tokens.",
          data: error.message,
        });
      }
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
  async verifyToken(req, res) {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        code: 400,
        status: "error",
        message: "Token não fornecido.",
      });
    }

    try {
      const decodedToken = AuthService.verifyToken(token);
      return res.status(200).json({
        code: 200,
        status: "success",
        decodedToken,
      });
    } catch (error) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Token inválido.",
        data: error.message,
      });
    }
  }

  async requestPasswordReset(req, res) {
    const { email, baseUrl } = req.body;
    try {
      const user = await AuthService.findUserByEmail(email);
      if (!user) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "Usuário não encontrado.",
        });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
      await user.save();
      
      // Utilize a URL base recebida no corpo da requisição
      const resetLink = `${baseUrl}/reset-password/${token}`;
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
          <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <div style="background-color: #0aa99d; padding: 10px; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; font-size: 24px; margin: 0;">Redefinição de Senha</h1>
            </div>
            <div style="padding: 20px;">
              <p style="font-size: 18px;">Recebemos uma solicitação para redefinir sua senha.</p>
              <p style="font-size: 16px;">Clique no link abaixo para redefinir sua senha:</p>
              <a href="${resetLink}" style="background-color: #0aa99d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; margin-top: 20px;">Redefinir Senha</a>
            </div>
            <div style="background-color: #f2f2f2; padding: 10px; border-radius: 0 0 8px 8px;">
              <p style="font-size: 14px; color: #777;">Se você não solicitou esta alteração, por favor, ignore este e-mail.</p>
            </div>
          </div>
        </div>
      `;
  
      await sendEmail(user.email, 'Redefinição de Senha', htmlTemplate);
  
      res.status(200).json({
        code: 200,
        status: "success",
        message: "Link de redefinição de senha enviado para o e-mail.",
      });
    } catch (error) {
      logger.error('Erro ao solicitar redefinição de senha.', { error });
      console.error(error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao solicitar redefinição de senha.",
        data: error,
      });
    }
  }
  

  async resetPassword(req, res) {
    const { token } = req.params;
    const { newPassword } = req.body;
   
    try {
      const user = await User.findOne({
        resetPasswordToken: token.toString(),
        resetPasswordExpires: { $gt: Date.now() },
      });
     
      if (!user) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Token inválido ou expirado.",
        });
      }

      user.password = await AuthService.hashPassword(newPassword);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      

      res.status(200).json({
        code: 200,
        status: "success",
        message: "Senha redefinida com sucesso.",
      });
    } catch (error) {
      logger.error('Erro ao redefinir a senha.', { error });
      
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao redefinir a senha.",
        data: error,
      });
    }
  }

};
