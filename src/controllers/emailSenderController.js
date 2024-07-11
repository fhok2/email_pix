const User = require('../models/User');
const { sendResponseMail } = require('../services/sendResponseMail');
const { criarEmail, deleteEmailTemporario } = require('../services/emailServices');

module.exports = class EmailSenderController {
  async sendEmail(req, res) {
    const { userEmail, clientEmail, subject, message } = req.body;

    try {
      // 1. Criar email temporário
      const localPart = userEmail.split('@')[0];
      const tempEmail = `${localPart}@${process.env.DOMINIO_EMAIL}`;
      const createEmailResponse = await criarEmail(localPart);
console.log('createEmailResponse:', createEmailResponse); // Add this line

      if (createEmailResponse.code !== 200 && createEmailResponse.message !== 'Email já existe') {
        return res.status(createEmailResponse.code).json(createEmailResponse);
      }

      // 2. Enviar email
      const mailData = {
        from: `${subject} <${tempEmail}>`,
        to: clientEmail,
        subject: subject,
        text: message, // Versão em texto simples
        user: tempEmail,
        pass: process.env.SENHA_PADRAO
      };

      await sendResponseMail(mailData);

      // 3. Excluir email temporário
      await deleteEmailTemporario(tempEmail);

      res.status(200).json({
        code: 200,
        status: 'success',
        message: 'Email enviado com sucesso e conta temporária removida'
      });
    } catch (error) {
      console.error('Erro ao processar o envio de email:', error);
      res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Erro ao processar o envio de email',
        error: error.message
      });
    }
  }
}
