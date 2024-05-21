const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const authRoutes = require('./src/routes/authRoutes');
const csrfRoutes = require('./src/routes/csrfRoutes');
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
  methods: ['GET', 'POST'],
  credentials: true,
}));

// Middleware para proteção contra CSRF
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Apenas em HTTPS em produção
    sameSite: 'strict', // Protege contra navegação cruzada
    maxAge: 3600 // 1 hora
  }
});

// Adicionar middleware CSRF antes das rotas
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next(); // Ignorar CSRF para a rota do webhook
  } else {
    csrfProtection(req, res, next); // Aplicar CSRF para outras rotas
  }
});

// Conectar ao banco de dados
connectDB();

// Rotas da aplicação
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/csrf', csrfRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = io; // Export the io instance
