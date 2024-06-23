const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const authRoutes = require('./src/routes/authRoutes');
const csrfRoutes = require('./src/routes/csrfRoutes');
const userRoutes = require('./src/routes/userRoutes');
const socket = require('./socket');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

// Configurar trust proxy
app.set('trust proxy', 1); // Configurar para confiar no primeiro proxy (ngrok, etc.)

// Middleware de segurança Helmet
app.use(helmet());

// Middleware de rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por IP por janela
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

app.use(limiter);

// Middleware para limpar XSS
app.use(xss());

// Middleware para parse de cookies
app.use(cookieParser());

// Middleware para parse de corpo da requisição
app.use(bodyParser.json());

// Configuração de CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','), // Lista de origens permitidas
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true, // Essencial para cookies
  allowedHeaders: ['Content-Type', 'X-CSRF-Token','Authorization'],
  exposedHeaders: ['X-CSRF-Token'], // Adicione este cabeçalho
}));

// Middleware de logging
app.use((req, res, next) => {
  console.log('--- Request Details ---');
  console.log('Method:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  next();
});

const csrfProtection = csrf({
  value: (req) => req.headers['x-csrf-token'],
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Apenas em HTTPS em produção
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // None em produção para permitir cookies entre domínios
    maxAge: 3600 // 1 hora
  }
});


// Middleware de CSRF aplicado apenas nas rotas que não sejam webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next(); // Ignorar CSRF para a rota do webhook
  } else {
    csrfProtection(req, res, next);
  }
});

// Conectar ao banco de dados
connectDB();

// Rotas da aplicação
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', csrfProtection, emailRoutes); // Aplicar CSRF aqui
app.use('/api/auth', authRoutes);
app.use('/api/csrf', csrfRoutes);
app.use('/api/user', userRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = io; // Export the io instance
