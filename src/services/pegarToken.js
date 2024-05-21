const axios = require("axios");
require('dotenv').config();

async function pegarToken() {
  const url = process.env.URL_SERVER_EMAIL;
  const dados = {
    username: process.env.SERVER_USERNAME,
    password: process.env.SERVER_PASSWORD,
  };

  try {
    const response = await axios.post(`${url}/api/login`, dados);
    const token = response.data.sessionID;
    return token;
  } catch (error) {
    console.error("Erro ao obter o token:", error);
    throw error;
  }
}

module.exports = pegarToken;
