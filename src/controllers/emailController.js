// src/controllers/emailController.js

const User = require("../models/User");
const EmailService = require("../services/emailService");
const logger = require("../utils/logger");

const crypto = require("crypto");
const { emailVerification } = require("../utils/emailTemplates");
const { sendEmail } = require("../services/sendEmailService");

module.exports = class EmailController {
  async bemvindo(req, res) {
    res.status(200).json({
      code: 200,
      status: "success",
      message: "Bem vindo a API de email",
    });
  }

  async criarEmail(req, res) {
    const { userEmail, customName, name, senha } = req.body;
    try {
      const response = await EmailService.criarEmail(
        userEmail,
        customName,
        name,
        senha
      );
      res.status(response.code).json(response);
    } catch (error) {
      logger.error("Erro ao criar o e-mail:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao criar o e-mail",
        data: error.message,
      });
    }
  }

  async direcionarEmail(req, res) {
    const { userEmail, customName, purpose } = req.body; // Adicione o campo 'purpose'

    try {
      if (!userEmail || !customName) {
        // Verifique se 'userEmail' e 'customName' estão presentes
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Email e email personalizado devem ser fornecidos",
        });
      }

      const response = await EmailService.direcionarEmail({
        customName,
        userEmail,
        purpose: purpose || "", // Defina um valor padrão (em branco) se 'purpose' não estiver presente
      });

      res.status(response.code).json(response);
    } catch (error) {
      logger.error("Erro ao direcionar o e-mail:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao direcionar o e-mail",
        data: error.message,
      });
    }
  }

  async cancelarEncaminhamento(req, res) {
    const { userEmail, clientEmail } = req.params;
    try {
      const response = await EmailService.cancelarEncaminhamento(
        userEmail,
        clientEmail
      );
      res.status(response.code).json(response);
    } catch (error) {
      
      logger.error("Erro ao cancelar o encaminhamento do e-mail:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao cancelar o encaminhamento do e-mail",
        data: error.message,
      });
    }
  }

  async reativarEncaminhamento(req, res) {
    const { userEmail, clientEmail } = req.params;
    try {
      const response = await EmailService.reativarEncaminhamento(
        userEmail,
        clientEmail
      );
      res.status(response.code).json(response);
    } catch (error) {
      logger.error("Erro ao reativar o encaminhamento do e-mail:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao reativar o encaminhamento do e-mail",
        data: error.message,
      });
    }
  }

  async atualizarEncaminhamento(req, res) {
    const { userEmail, clientEmail, forwardingEmail, purpose } = req.body;
    try {
      const response = await EmailService.atualizarEncaminhamento(
        userEmail,
        clientEmail,
        forwardingEmail,
        purpose
      );
      res.status(response.code).json(response);
    } catch (error) {
      logger.error("Erro ao atualizar o encaminhamento do e-mail:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao atualizar o encaminhamento do e-mail",
        data: error.message,
      });
    }
  }

  async excluirEmail(req, res) {
    const { userEmail, clientEmail } = req.params;
    try {
      const response = await EmailService.excluirEmail(userEmail, clientEmail);
      res.status(response.code).json(response);
    } catch (error) {
      console.log(error);
      logger.error("Erro ao excluir o e-mail:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao excluir o e-mail",
        data: error.message,
      });
    }
  }
  async reativarEmail(req, res) {
    const { userEmail, clientEmail } = req.params;
    try {
      const response = await EmailService.reativarEmail(userEmail, clientEmail);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao reativar o e-mail:', error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao reativar o e-mail",
        data: error.message,
      });
    }
  }

  async enviarTokenVerificacao(req, res) {
    const { email,baseUrl } = req.body;

    try {
      const user = await User.findOne({ email });
      console.log(user);
      if (!user) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "Usuário não encontrado",
        });
      }

      const token = crypto.randomBytes(32).toString('hex');
      user.emailVerification = {
        token,
        createdAt: new Date(),
        verified: false
      };
      await user.save();

      const verificationLink = `${baseUrl}/verify-email?token=${token}`;
      
      const templateMail = emailVerification(verificationLink);

      const dataMail = {
        from: `"Verificação de email EficazMail" <${process.env.EMAIL_FROM }>`,
        to: user.email,
        subject: 'Verificação de Email',
        html: templateMail,
      };
      await sendEmail(dataMail);

      res.status(200).json({
        code: 200,
        status: "success",
        message: "Token de verificação enviado com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao enviar token de verificação:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao enviar token de verificação",
        data: error.message,
      });
    }
  }

  async validarEmail(req, res) {
    const { token } = req.params;
  
    try {
      const user = await User.findOne({ 'emailVerification.token': token });
      console.log('Usuário encontrado:', user);
  
      if (!user) {
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Token inválido ou expirado",
        });
      }
  
      if (user.emailVerified) {
        return res.status(200).json({
          code: 200,
          status: "success",
          message: "Email já verificado",
        });
      }
  
      const result = await User.updateOne(
        { _id: user._id },
        {
          $set: { emailVerified: true },
          $unset: { emailVerification: "" }
        }
      );
  
  
      if (result.modifiedCount === 0) {
        throw new Error('Falha ao atualizar o usuário');
      }
  
      const updatedUser = await User.findById(user._id);
      
  
      res.status(200).json({
        code: 200,
        status: "success",
        message: "Email verificado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao validar email:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao validar email",
        data: error.message,
      });
    }
  }

};
