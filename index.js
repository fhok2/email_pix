const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const session = require('express-session');
const crypto = require('crypto');
const connectDB = require('./src/config/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const authRoutes = require('./src/routes/authRoutes');
const csrfRoutes = require('./src/routes/csrfRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRouter = require('./src/routes/adminRouters');
const socket = require('./socket');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { csrfProtection } = require('./src/middlewares/csrfProtection');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

// Configuração da sessão
app.use(session({
  secret: process.env.SESSION_SECRET || 'sua_chave_secreta_aqui',
  resave: false, 
  saveUninitialized: false, 
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
app.use(cookieParser());
app.set('trust proxy', 1);

// Middlewares de segurança e parsing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
});

app.use(limiter);
app.use(helmet());
app.use(xss());
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
  exposedHeaders: ['X-CSRF-Token'],
}));

// Middleware para gerar ou recuperar o token CSRF da sessão
app.use((req, res, next) => {
  if (!req.session.csrfToken) {
    console.log(req.session)
    req.session.csrfToken = crypto.randomBytes(16).toString('hex');
    console.log('New CSRF Token generated:', req.session.csrfToken);
  } else {
    console.log('Existing CSRF Token:', req.session.csrfToken);
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
});

app.use((req, res, next) => {
  if (req.path === '/api/csrf/get-csrf-token' || req.originalUrl === '/api/payments/webhook') {
    return next();
  }
  csrfProtection(req, res, next);
});

// Middleware de log
app.use((req, res, next) => {
  console.log('Session ID:', req.sessionID);
  console.log('CSRF Token in session:', req.session.csrfToken);
  next();
});

connectDB();

app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/csrf', csrfRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRouter);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});

module.exports = io;
