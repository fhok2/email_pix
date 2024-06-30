const express = require('express');
const router = express.Router();

router.get('/get-csrf-token', (req, res) => {
  const csrfToken = req.session.csrfToken;

  res.cookie('XSRF-TOKEN', csrfToken, { 
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 3600000 // 1 hora
  });

  res.json({ csrfToken: csrfToken });
});

module.exports = router;
