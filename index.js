const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
// const session = require('express-session');
// const crypto = require('crypto');
const connectDB = require('./src/config/database');
const paymentRoutes = require('./src/routes/paymentRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const authRoutes = require('./src/routes/authRoutes');
// const csrfRoutes = require('./src/routes/csrfRoutes');
const userRoutes = require('./src/routes/userRoutes');
const adminRouter = require('./src/routes/adminRouters');
const socket = require('./socket');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
// const { csrfProtection } = require('./src/middlewares/csrfProtection');

const app = express();
const server = http.createServer(app);
const io = socket.init(server);


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
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como apps móveis ou curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
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

// Middleware para logging (opcional, para depuração)
app.use((req, res, next) => {
  console.log('Request origin:', req.get('origin'));
  console.log('Request method:', req.method);
  next();
});


connectDB();

app.use('/api/payments', paymentRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/auth', authRoutes);
// app.use('/api/csrf', csrfRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRouter);

// Middleware de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3005;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});

module.exports = io;
