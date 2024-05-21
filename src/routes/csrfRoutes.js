const express = require('express');
const csrf = require('csurf');

const router = express.Router();

// Middleware CSRF
const csrfProtection = csrf({ cookie: true });

// Rota para obter o token CSRF
router.get('/get-csrf-token', csrfProtection, (req, res) => {
  res.status(200).json({ csrfToken: req.csrfToken() });
});

module.exports = router;
