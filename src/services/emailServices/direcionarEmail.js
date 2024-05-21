const axios = require("axios");
const getToken = require("../tokenService");
require("dotenv").config();
const DOMAIN = require("../../enums/dominio");

async function direcionarEmail(dataEmails) {
  const { clientEmail, userEmail } = dataEmails;

  if (!clientEmail || !userEmail) {
    throw new Error("clientEmail and userEmail must be provided");
  }

  const token = await getToken();
  
  const EMAIL_SERVER_CONFIG = {
    URL: process.env.URL_SERVER_EMAIL,
    DOMAIN: DOMAIN.PRINCIPAL,
  };

  const headers = {
    Cookie: `session=${token}`,
    "X-Directadmin-Session-Id": token,
    "Content-Type": "application/json; charset=utf-8",
  };

  const body = {
    user: clientEmail,
    email: userEmail,
    domain: EMAIL_SERVER_CONFIG.DOMAIN,
    json: "yes",
    action: "modify",
  };

  try {
    const response = await axios.post(
      EMAIL_SERVER_CONFIG.URL + "/CMD_EMAIL_FORWARDER?json=yes",
      body,
      { headers }
    );

    return {
      code: 200,
      status: "success",
      message: "Email direcionado com sucesso",
      data: response.data.success,
    };
  } catch (error) {
    return {
      code: 500,
      status: "error",
      message: "Erro ao direcionar o email",
      data: error.response.data,
    };
  }
}

module.exports = direcionarEmail;
