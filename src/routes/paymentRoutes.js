// src/routes/paymentRoutes.js

const express = require('express');
const { body } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const validateRequest = require('../middlewares/validateRequest');
const authenticate = require('../middlewares/auth');

const router = express.Router();

router.post('/create-guest',
  body('name').isString().withMessage('Nome é obrigatório').trim().escape(),
  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF inválido').trim().escape(),
  body('phone').optional().isString().withMessage('Telefone inválido').trim().escape(),

  validateRequest,
  paymentController.createPaymentGuest
);

router.post('/create-auth',
body('cpf').isLength({ min: 11, max: 14 }).withMessage('CPF inválido').trim().escape(),
  authenticate,
  validateRequest,
  paymentController.createPaymentAuth
);

router.post('/webhook',
  body('event').isString().withMessage('Evento é obrigatório'),
  body('charge').isObject().withMessage('Dados da cobrança são obrigatórios'),
  validateRequest,
  paymentController.handleWebhook
);
// Nova rota para iniciar uma sessão de pagamento
router.post('/startPayment', 
  body('transactionID').isString().withMessage('Transaction ID é obrigatório'),
  validateRequest,
  paymentController.startPaymentSession
);

module.exports = router;
