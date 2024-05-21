// src/routes/authRoutes.js

const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const AuthController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

const authRouter = express.Router();
const authController = new AuthController();

const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 requisições por IP por janela
  message: 'Too many refresh requests from this IP, please try again after 15 minutes',
});

authRouter.post('/sendPassword', 
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  validateRequest,
  authController.sendPassword
);

authRouter.post('/login', 
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres').trim().escape(),
  validateRequest,
  authController.login
);

authRouter.post('/refreshToken', 
  refreshRateLimiter,
  body('refreshToken').isString().withMessage('Refresh token é obrigatório'),
  validateRequest,
  authController.refreshToken
);

authRouter.post('/logout', authenticate, authController.logout);

module.exports = authRouter;
