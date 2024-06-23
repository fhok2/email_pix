// src/controllers/emailController.js

const EmailService = require('../services/emailService');
const logger = require('../utils/logger');


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
      const response = await EmailService.criarEmail(userEmail, customName, name, senha);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao criar o e-mail:', error);
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
      if (!userEmail || !customName) { // Verifique se 'userEmail' e 'customName' estão presentes
        return res.status(400).json({
          code: 400,
          status: "error",
          message: "Email e email personalizado devem ser fornecidos",
        });
      }
  
      const response = await EmailService.direcionarEmail({
        customName,
        userEmail,
        purpose: purpose || '' // Defina um valor padrão (em branco) se 'purpose' não estiver presente
      });
  
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao direcionar o e-mail:', error);
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
      const response = await EmailService.cancelarEncaminhamento(userEmail, clientEmail);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao cancelar o encaminhamento do e-mail:', error);
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
      const response = await EmailService.reativarEncaminhamento(userEmail, clientEmail);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao reativar o encaminhamento do e-mail:', error);
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
        const response = await EmailService.atualizarEncaminhamento(userEmail, clientEmail, forwardingEmail, purpose);
        res.status(response.code).json(response);
    } catch (error) {
        console.log(error);
        logger.error('Erro ao atualizar o encaminhamento do e-mail:', error);
        res.status(500).json({
            code: 500,
            status: "error",
            message: "Erro ao atualizar o encaminhamento do e-mail",
            data: error.message,
        });
    }
}

  async listarUsuarios(req, res) {
    try {
      const response = await EmailService.listarUsuarios();
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Erro ao listar usuários',
        data: error.message,
      });
    }
  }

  async atualizarPlano(req, res) {
    const { userId, novoPlano } = req.body;
    try {
      const response = await EmailService.atualizarPlano(userId, novoPlano);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao atualizar o plano:', error);
      res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Erro ao atualizar o plano',
        data: error.message,
      });
    }
  }

  // Novo método para listar emails do usuário
  async listarEmailsUsuario (req, res) {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
  
    try {
      const response = await EmailService.listarEmailsUsuario(userId, page, limit);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao listar os e-mails do usuário:', error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao listar os e-mails do usuário",
        data: error.message,
      });
    }
  };
};
