const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const connectDB = require('./src/config/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRouter = require('./src/routes/adminRouters');
const socket = require('./socket');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const serverless = require('serverless-http');

const app = express();

// Middleware de segurança e parsing
app.use(cookieParser());
app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use(limiter);
app.use(helmet());
app.use(xss());
app.use(bodyParser.json());

const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('chrome-extension://')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  exposedHeaders: ['X-CSRF-Token'],
  credentials: true,
  optionsSuccessStatus: 204
}));

// Middleware para logging
app.use((req, res, next) => {
  console.log('Request URL:', req.originalUrl);
  console.log('Request body:', req.body);
  next();
});

// Conexão com o banco de dados
connectDB();

// Rotas
app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRouter);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Configuração para ambiente de desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const server = http.createServer(app);
  const io = socket.init(server);

  const PORT = process.env.PORT || 3005;
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta: ${PORT}`);
  });

  module.exports = io;
} else {
  // Configuração para Vercel (produção)
  const wrappedHandler = serverless(app);
  
  module.exports = async (req, res) => {
    // Inicializa o Socket.IO para cada requisição na Vercel
    const server = http.createServer(app);
    const io = socket.init(server);
    
    // Adiciona o io ao objeto req para que possa ser acessado nas rotas
    req.io = io;
    
    return wrappedHandler(req, res);
  };
}