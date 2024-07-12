// src/utils/emailTemplates.js

const styles = `
  /* Resets */
  body, p { margin: 0; padding: 0; }
  img { border: 0; display: block; }

  /* Base styles */
  body {
    font-family: Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: #111827;
    background-color: #f9fafb;
  }

  /* Container */
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
  }

  /* Header */
  .header {
    background-color: #09b6a2;
    padding: 20px;
    text-align: center;
  }

  .header h1 {
    color: #ffffff;
    font-size: 24px;
    margin: 0;
  }

  /* Content */
  .content {
    padding: 30px;
    background-color: #ffffff;
  }

  /* Button */
  .button {
    display: inline-block;
    background-color: #09b6a2;
    color: #ffffff !important;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-weight: bold;
    text-align: center;
  }

  /* Footer */
  .footer {
    background-color: #FAF9FC;
    padding: 20px;
    text-align: center;
    color: #6b7280;
    font-size: 14px;
  }
`;

module.exports = {
  passwordReset: (resetLink) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redefinição de Senha</title>
      <style>
        ${styles}
      </style>
    </head>
    <body>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f9fafb">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse: separate; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td class="header">
                  <h1>Redefinição de Senha</h1>
                </td>
              </tr>
              <tr>
                <td class="content">
                  <p style="margin-bottom: 20px;">Olá,</p>
                  <p style="margin-bottom: 20px;">Recebemos uma solicitação para redefinir a senha da sua conta. Se você não fez esta solicitação, por favor ignore este e-mail.</p>
                  <p style="margin-bottom: 20px;">Para redefinir sua senha, clique no botão abaixo:</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${resetLink}" class="button">Redefinir Minha Senha</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin-bottom: 20px;">Se o botão acima não funcionar, você também pode copiar e colar o seguinte link em seu navegador:</p>
                  <p style="word-break: break-all; color: #09b6a2;">${resetLink}</p>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>Este é um e-mail automático. Por favor, não responda.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

  emailVerification: (verificationLink) => `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verificação de E-mail</title>
      <style>
        ${styles}
      </style>
    </head>
    <body>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#f9fafb">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="border-collapse: separate; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <tr>
                <td class="header">
                  <h1>Bem-vindo!</h1>
                </td>
              </tr>
              <tr>
                <td class="content">
                  <p style="margin-bottom: 20px;">Olá,</p>
                  <p style="margin-bottom: 20px;">Obrigado por se cadastrar em nossa plataforma. Para completar seu registro e garantir a segurança da sua conta, precisamos verificar seu endereço de e-mail.</p>
                  <p style="margin-bottom: 20px;">Por favor, clique no botão abaixo para verificar seu e-mail:</p>
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td align="center" style="padding: 20px 0;">
                        <a href="${verificationLink}" class="button">Verificar Meu E-mail</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin-bottom: 20px;">Se o botão acima não funcionar, você também pode copiar e colar o seguinte link em seu navegador:</p>
                  <p style="word-break: break-all; color: #09b6a2;">${verificationLink}</p>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  <p>Se você não se cadastrou em nossa plataforma, por favor ignore este e-mail.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `,

};