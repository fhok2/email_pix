const axios = require("axios");
const getToken = require("../tokenService");
require("dotenv").config();
const DOMAIN = require("../../enums/dominio");

const EMAIL_API_URL = process.env.URL_SERVER_EMAIL + "/CMD_EMAIL_POP?json=yes";

async function criarEmail(email) {
  const token = await getToken();
  

  const headers = {
    Cookie: `session=${token}`,
    "X-Directadmin-Session-Id": token,
    "Content-Type": "application/json; charset=utf-8",
  };

  if(email.includes('@')){
    email = email.split('@')[0];
  }
  const body = {
    user: email,
    passwd2: process.env.EMAIL_PASS_USER_DEFAULT,
    passwd: process.env.EMAIL_PASS_USER_DEFAULT,
    quota: "100",
    limit: "1000",
    domain: DOMAIN.PRINCIPAL,
    json: "yes",
    action: "create",
  };


  try {
    const response = await axios.post(EMAIL_API_URL, body, { headers });

    return {
      code: 200,
      status: "success",
      message: "Email criado com sucesso",
      email: email + "@" + process.env.DOMINIO_EMAIL,
      data: response.data.success,
    };
  } catch (error) {
    if (error.response.data.result.includes("exists")) {
      return {
        code: 404,
        status: "error",
        message: "Email já existe",
        data: error.response.data.result,
      };
    }
  
    return {
      code: 500,
      status: "error",
      message: "Erro ao criar o email",
      data: error.response.data,
    };
  }
}

module.exports = criarEmail;
