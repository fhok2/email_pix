const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function sendResponseMail(dataMail) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: dataMail.user,
      pass: dataMail.pass || process.env.EMAIL_PASS_USER_DEFAULT,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    // Ler o template HTML
    const htmlTemplate = await fs.readFile(path.join(__dirname, '../templates/email-template.html'), 'utf-8');
    
    // Compilar o template com Handlebars
    const template = handlebars.compile(htmlTemplate);
    const htmlToSend = template({
      subject: dataMail.subject,
      message: dataMail.text
    });

    // Configurar as opções do e-mail
    const mailOptions = {
      from: dataMail.from,
      to: dataMail.to,
      subject: dataMail.subject,
      text: dataMail.text, // Versão em texto simples
      html: htmlToSend // Versão HTML
    };

    // Enviar o e-mail
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
}

module.exports = {
  sendResponseMail,
};