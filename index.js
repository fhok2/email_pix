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
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { csrfProtection } = require('./src/middlewares/csrfProtection');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);


app.set('trust proxy', 1);

// Middlewares
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
});

app.use(limiter);
app.use(helmet());
app.use(xss());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
  exposedHeaders: ['X-CSRF-Token'],
}));

app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/webhook') {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});


app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.cookies['XSRF-TOKEN'].split('.')[0] });
});


connectDB();


app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/csrf', csrfRoutes);
app.use('/api/user', userRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});

module.exports = io;