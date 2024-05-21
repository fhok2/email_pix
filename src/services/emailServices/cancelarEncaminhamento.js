const axios = require("axios");
const getToken = require("../tokenService");
require("dotenv").config();
const DOMINIO = require("../../enums/dominio");

async function cancelarEncaminhamento(clientEmail) {
  const token = await getToken();
  
  const EMAIL_SERVER_CONFIG = {
    URL: process.env.URL_SERVER_EMAIL,
    DOMAIN: DOMINIO.PRINCIPAL,
  };

  const headers = {
    Cookie: `session=${token}`,
    "X-Directadmin-Session-Id": token,
    "Content-Type": "application/json; charset=utf-8",
  };

  const body = {
    select0: clientEmail.replace(`@${EMAIL_SERVER_CONFIG.DOMAIN}`, ''),
    domain: EMAIL_SERVER_CONFIG.DOMAIN,
    json: "yes",
    action: "delete",
    delete: "yes"
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
      message: "Encaminhamento de email cancelado com sucesso",
      data: response.data.success,
    };
  } catch (error) {
  
    return {
      code: 500,
      status: "error",
      message: "Erro ao cancelar encaminhamento do email",
      data: error.response.data,
    };
  }
}

module.exports = cancelarEncaminhamento;
