const csrfProtection = (req, res, next) => {
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  console.log('Received CSRF Token:', token);
  console.log('Session CSRF Token:', req.session.csrfToken);
  console.log('Session ID:', req.sessionID);

  if (!req.session.csrfToken) {
    console.log('No CSRF token in session');
    return res.status(403).json({ error: 'No CSRF token in session' });
  }

  if (!token) {
    console.log('No CSRF token provided in request');
    return res.status(403).json({ error: 'No CSRF token provided' });
  }

  if (token !== req.session.csrfToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

module.exports = { csrfProtection };
