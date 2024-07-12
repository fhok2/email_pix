const nodemailer = require("nodemailer");
require("dotenv").config();

function preserveFormatting(text) {
  return text.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;");
}

function sendResponseMailTemplate(message) {
  const formattedMessage = preserveFormatting(message);
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
html, body {
  height: 100%;
  margin: 0;
}

.container {
  width: 100%;
  height: 100%;
  margin: 0 auto;
  background-color: #ffffff;
  border-radius: 0; /* Removido para ocupar totalmente os cantos */
  overflow: hidden;
  box-shadow: none; /* Opcional: remover se não desejar sombra em um elemento de tela cheia */
}

.content {
  background-color: #ffffff;
  padding: 20px;
}
</style>
</head>
<body>
<div class="container">
  <div class="content">
    ${formattedMessage}
  </div>
</div>
</body>
</html>   
  `;
}

async function sendResponseMail(dataMail) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: dataMail.user,
      pass: dataMail.pass || process.env.EMAIL_PASS_USER_DEFAULT,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });

  try {
    // Usar o novo template
    const htmlToSend = sendResponseMailTemplate(dataMail.text);
    console.log("htmlToSend", htmlToSend);

    // Configurar as opções do e-mail
    const mailOptions = {
      from: dataMail.from,
      to: dataMail.to,
      subject: dataMail.subject,
      text: dataMail.text, // Versão em texto simples
      html: htmlToSend,
    };

    // Enviar o e-mail
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw error;
  }
}

module.exports = {
  sendResponseMail,
};
