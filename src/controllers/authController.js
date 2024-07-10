const crypto = require('crypto');
const AuthService = require('../services/authService');
const { generateAndSendPassword } = require('../services/passwordService');
const { sendEmail } = require('../services/sendEmailService');
const logger = require('../utils/logger');
const { passwordReset } = require('../utils/emailTemplates');
const User = require('../models/User');

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
      if (!email || !password) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Email e senha são obrigatórios.",
        });
      }

      const user = await AuthService.findUserByEmail(email);
      if (!user || !user.password) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Credenciais inválidas.",
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

      const dashboardData = {
        userId: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        role: user.role,
        permissions: user.permissions,
        emailVerified: user.emailVerified,
        paymentDate: user.paymentDate
      };

      res.status(200).json({
        code: 200,
        status: "success",
        message: "Login bem-sucedido.",
        dashboardData,
        token,
        refreshToken,
      });
    } catch (error) {
      logger.error('Erro ao realizar login.', { error });
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao realizar login.",
        data: error.message,
      });
    }
  }

  async googleLogin(req, res) {
    try {
      const { idToken } = req.body;
      const googleUser = await AuthService.verifyFirebaseToken(idToken);
      
      let user = await User.findOne({ email: googleUser.email });
      if (!user) {
        user = await AuthService.createUserFromFirebase(googleUser);
      } else if (!user.emailVerified) {
        // If the user exists but email wasn't verified, update it using updateOne
        await User.updateOne({ _id: user._id }, { $set: { emailVerified: true } });
        user.emailVerified = true; // Update the local user object as well
      }
  
      const accessToken = AuthService.generateToken(user);
      const refreshToken = AuthService.generateRefreshToken(user);
  
     
      await User.updateOne({ _id: user._id }, { $set: { refreshToken: refreshToken } });
  
      res.status(200).json({
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        }
      });
    } catch (error) {
      console.error('Google login error:', error);
      res.status(401).json({ message: 'Authentication failed', error: error.message });
    }
  };

  async refreshToken(req, res) {
    const { refreshToken } = req.body;
  
    if (!refreshToken) {
      return res.status(401).json({
        code: 401,
        status: "error",
        message: "Refresh token não fornecido.",
      });
    }
  
    try {
      const { newAccessToken, newRefreshToken } = await AuthService.renewTokens(refreshToken);
  
      res.status(200).json({
        code: 200,
        status: "success",
        token: newAccessToken,
        refreshToken: newRefreshToken,
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
      
      const resetLink = `${baseUrl}/reset-password/${token}`;
  
      const template =passwordReset(resetLink);
  
      const dataMail = {
        from: `"Recuperação de Senha" <${process.env.EMAIL_FROM }>`,
        to: user.email,
        subject: 'Redefinição de Senha',
        html: template,
      };
      await sendEmail(dataMail);
  
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
  

  async  resetPasswordController(req, res) {
    const { token } = req.params;
    const { newPassword } = req.body;
  
    try {
      await AuthService.resetPassword(token, newPassword);
  
      res.status(200).json({
        code: 200,
        status: "success",
        message: "Senha redefinida com sucesso.",
      });
    } catch (error) {
      
      logger.error('Erro ao redefinir a senha.', { error });
  
      const statusCode = error.statusCode || 500;
      const message = statusCode === 400 ? error.message : "Erro ao redefinir a senha.";
  
      res.status(statusCode).json({
        code: statusCode,
        status: "error",
        message,
      });
    }
  }

};
