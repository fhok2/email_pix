const crypto = require('crypto');

// Função para gerar um novo token CSRF
function generateCSRFToken() {
  return crypto.randomBytes(16).toString('hex');
}

// Função para verificar se o token está expirado
function isTokenExpired(token, maxAge) {
  const [tokenValue, timestamp] = token.split('.');
  const creationTime = parseInt(timestamp, 10);
  const currentTime = Date.now();
  return currentTime - creationTime > maxAge;
}

// Middleware de proteção CSRF
function csrfProtection(req, res, next) {
  // Ignorar métodos seguros
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  const csrfTokenFromCookie = req.cookies['XSRF-TOKEN'];
  const csrfTokenFromHttpOnlyCookie = req.cookies['_csrf'];
  const csrfTokenFromHeader = req.headers['x-csrf-token'];

  const maxAge = 30000; // 30 segundos, igual ao definido na rota

  // Se não houver token nos cookies ou no cabeçalho, ou se algum token estiver expirado
  if (!csrfTokenFromCookie || !csrfTokenFromHttpOnlyCookie || !csrfTokenFromHeader) {
    return res.status(403).json({ message: 'CSRF token missing' });
  }

  if (isTokenExpired(csrfTokenFromCookie, maxAge) || isTokenExpired(csrfTokenFromHttpOnlyCookie, maxAge)) {
    return res.status(403).json({ message: 'CSRF token expired' });
  }

  // Verificar se os tokens coincidem
  const [tokenValueFromCookie] = csrfTokenFromCookie.split('.');
  const [tokenValueFromHttpOnlyCookie] = csrfTokenFromHttpOnlyCookie.split('.');
  const [tokenValueFromHeader] = csrfTokenFromHeader.split('.');

  if (tokenValueFromCookie !== tokenValueFromHeader || tokenValueFromCookie !== tokenValueFromHttpOnlyCookie) {
    return res.status(403).json({ message: 'CSRF token mismatch' });
  }

  next();
}

// Função para atualizar os tokens CSRF
function refreshCSRFToken(req, res, next) {
  const newToken = generateCSRFToken();
  const tokenWithTimestamp = `${newToken}.${Date.now()}`;
  const maxAge = 3600000;

  res.cookie('XSRF-TOKEN', tokenWithTimestamp, {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: maxAge
  });

  res.cookie('_csrf', tokenWithTimestamp, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: maxAge
  });

  // Atualizar os tokens no objeto req.cookies para uso posterior nesta requisição
  req.cookies['XSRF-TOKEN'] = tokenWithTimestamp;
  req.cookies['_csrf'] = tokenWithTimestamp;

  // Enviar resposta informando que o token foi atualizado
  res.status(200).json({ message: 'CSRF token refreshed', newToken: newToken });

  // Não continuar com a requisição, pois já respondemos
  // next();
}

module.exports = { csrfProtection, refreshCSRFToken };
