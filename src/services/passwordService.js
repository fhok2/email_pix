const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../models/User');
require('dotenv').config();

function generatePassword(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function validatePassword(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }
  return bcrypt.compare(password, user.password);
}

async function sendEmail(email, subject, html) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: subject,
    html: html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso!');
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    throw error;
  }
}

async function generateAndSendPassword(email) {
  const user = await User.findOne({ email });
  if (!user) {
    return { code: 404, message: 'User not found' };
  }

  const newPassword = generatePassword();
  const hashedPassword = await hashPassword(newPassword);

  user.password = hashedPassword;
  await user.save();

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; color: #333; text-align: center; padding: 20px;">
      <div style="max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
        <div style="background-color: #4CAF50; padding: 10px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; font-size: 24px; margin: 0;">Recuperação de Senha</h1>
        </div>
        <div style="padding: 20px;">
          <img src="cid:lock-image" alt="Lock Image" style="width: 100px; height: auto; margin-bottom: 20px;">
          <p style="font-size: 18px;">Recebemos uma solicitação para redefinir sua senha.</p>
          <p style="font-size: 16px;">Sua nova senha é:</p>
          <div style="background-color: #f2f2f2; padding: 10px; border-radius: 8px; display: inline-block; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold;">${newPassword}</span>
          </div>
          <p style="font-size: 16px;">Por favor, use esta senha para acessar o seu dashboard. Recomendamos que você altere a senha após o primeiro login.</p>
          <a href="https://www.seusite.com/login" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; margin-top: 20px;">Acessar Dashboard</a>
        </div>
        <div style="background-color: #f2f2f2; padding: 10px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 14px; color: #777;">Se você não solicitou esta alteração, por favor, ignore este e-mail.</p>
        </div>
      </div>
    </div>
  `;

  await sendEmail(email, 'Sua nova senha', htmlTemplate);
  return { code: 200, message: 'Password sent' };
}

module.exports = {
  generateAndSendPassword,
  validatePassword,
  generatePassword,
  hashPassword,
  sendEmail
};
