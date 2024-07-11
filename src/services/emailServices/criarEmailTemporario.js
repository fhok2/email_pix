const criarEmail = require('./criarEmail');
const { sendEmail } = require('../sendEmailService');
const crypto = require('crypto');

async function criarEmailTemporario(userEmail, customName) {
  // Generate a random password
  const tempPassword = crypto.randomBytes(10).toString('hex');

  // Create the email using the existing criarEmail function
  const emailResult = await criarEmail(customName, tempPassword);
  

  if (emailResult.code !== 200) {
    return emailResult; // Return error if email creation failed
  }

  // Prepare email content
  const emailContent = `
    <h1>Seu email temporário foi criado</h1>
    <p>Email: ${customName}@${process.env.DOMINIO_EMAIL}</p>
    <p>Senha: ${tempPassword}</p>
    <p>Este email será deletado após o uso.</p>
  `;

  // Send email with credentials
  await sendEmail({
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: 'Credenciais do Email Temporário',
    html: emailContent,
  });

  return {
    code: 200,
    status: 'success',
    message: 'Email temporário criado e credenciais enviadas',
    data: {
      tempEmail: `${customName}@${process.env.DOMINIO_EMAIL}`,
    },
  };
}

module.exports = criarEmailTemporario;