const axios = require('axios');
const getToken = require('../tokenService');
const DOMAIN = require('../../enums/dominio');
const { AppError } = require('../../middlewares/errorHandler');


const EMAIL_SERVER_CONFIG = {
  URL: process.env.URL_SERVER_EMAIL,
  DOMAIN: DOMAIN.PRINCIPAL,
};

async function getHeaders() {
  const token = await getToken();
  return {
    'Cookie': `session=${token}`,
    'X-Directadmin-Session-Id': token,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Origin': EMAIL_SERVER_CONFIG.URL,
    'Referer': `${EMAIL_SERVER_CONFIG.URL}/evo/user/email/accounts`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0',
  };
}

async function deleteEmailTemporario(emailToDelete) {
  if (!emailToDelete) {
    throw new AppError("Email to delete must be provided", 400);
  }

  const localPart = emailToDelete.split('@')[0];

  const body = {
    clean_forwarders: 'no',
    domain: EMAIL_SERVER_CONFIG.DOMAIN,
    json: 'yes',
    action: 'delete',
    delete: 'yes',
    select0: localPart,
  };

  try {
    const response = await axios.post(
      `${EMAIL_SERVER_CONFIG.URL}/CMD_EMAIL_POP?json=yes`,
      body,
      { headers: await getHeaders() }
    );

    return {
      code: 200,
      status: 'success',
      message: 'Email deletado com sucesso',
      data: response.data,
    };
  } catch (error) {
    throw new AppError(
      error.response?.data?.error || 'Erro ao deletar o email',
      error.response?.status || 500
    );
  }
}

module.exports = deleteEmailTemporario;