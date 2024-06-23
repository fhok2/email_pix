const express = require('express');
const csrf = require('csurf');
const router = express.Router();

// Middleware CSRF
const csrfProtection = csrf({ cookie: true }); // Habilita o cookie por padrão

// Rota para obter o token CSRF
router.get('/get-csrf-token', csrfProtection, (req, res) => {
  res.cookie('XSRF-TOKEN', req.csrfToken(), { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.setHeader('X-CSRF-Token', req.csrfToken()); // Define o token CSRF no header da resposta
  res.json({ csrfToken: req.csrfToken() });  // Envia o token no corpo da resposta
});

module.exports = router;
