const express = require('express');
const csrf = require('csurf');
const router = express.Router();

// Middleware CSRF
const csrfProtection = csrf({ cookie: true }); // Habilita o cookie por padrão

// Rota para obter o token CSRF (corrigida)
router.get('/get-csrf-token', csrfProtection, (req, res) => {
  // Definir o cookie XSRF-TOKEN (já é feito automaticamente pelo middleware)
  res.json({ csrfToken: req.csrfToken() });  // Envia o token no corpo da resposta
});

module.exports = router;
