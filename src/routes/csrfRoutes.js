const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Função para gerar o token CSRF
function generateCSRFToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Rota para obter o token CSRF
router.get('/get-csrf-token', (req, res) => {
  const csrfToken = generateCSRFToken();
  const maxAge = 3600000;

  res.cookie('XSRF-TOKEN', csrfToken, { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: maxAge 
  });

  res.cookie('_csrf', csrfToken, { 
    httpOnly: true,  
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: maxAge 
  });

  res.json({ csrfToken });
});

// Rota para verificar o token CSRF
router.post('/verify-csrf', (req, res) => {
  res.json({ message: 'CSRF token is valid' });
});

module.exports = router;
