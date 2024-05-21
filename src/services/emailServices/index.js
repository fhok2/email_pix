// src/services/emailService/index.js
const cancelarEncaminhamento = require('./cancelarEncaminhamento');
const criarEmail = require('./criarEmail');
const direcionarEmail = require('./direcionarEmail');

module.exports = {
  cancelarEncaminhamento,
  criarEmail,
  direcionarEmail,
};
