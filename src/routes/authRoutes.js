const express = require('express');
const { body, param } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const AuthController = require('../controllers/authController');
const rateLimit = require('express-rate-limit');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

const authRouter = express.Router();
const authController = new AuthController();
const isURLWithHTTPorHTTPS = (value) => {
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    throw new Error('URL base deve começar com http:// ou https://');
  }
  return true;
};


const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Limite de 5 requisições por IP por janela
  message: 'Too many refresh requests from this IP, please try again after 15 minutes',
});

authRouter.post('/verifyToken', authController.verifyToken);

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

body('refreshToken').not().isEmpty().withMessage('Token de atualização é obrigatório'),
  authController.refreshToken
);

authRouter.post('/logout', authenticate, authController.logout);

authRouter.post(
  '/requestPasswordReset',
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('baseUrl').custom(isURLWithHTTPorHTTPS),
  validateRequest,
  (req, res, next) => {
    authController.requestPasswordReset(req, res, next);
  }
);


authRouter.post('/resetPassword/:token', 
  param('token').not().isEmpty().withMessage('Token é obrigatório'),
  body('newPassword').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres').trim().escape(),
  validateRequest,
  authController.resetPasswordController
);


module.exports = authRouter;
