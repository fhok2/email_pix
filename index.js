const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

// Configuração básica
app.use(cookieParser());
app.use(helmet());
app.use(xss());
app.use(express.json());

// Configuração CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 204
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Conexão com o banco de dados
const connectDB = require('./src/config/database');
connectDB().catch(console.error);

// Rotas
app.use('/api/payments', require('./src/routes/paymentRoutes'));
app.use('/api/emails', require('./src/routes/emailRoutes'));
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/user', require('./src/routes/userRoutes'));
app.use('/api/admin', require('./src/routes/adminRouters'));

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', env: process.env.NODE_ENV });
});

// Middleware de tratamento de erros
app.use(errorHandler);

// Exportação para Vercel
module.exports = serverless(app);

// Para desenvolvimento local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => console.log(`Servidor rodando na porta: ${PORT}`));
}