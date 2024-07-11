const express = require('express');
const { body, param } = require('express-validator');
const emailRouter = express.Router();
const EmailController = require('../controllers/emailController');
const emailController = new EmailController();
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const verifyUserEmail = require('../middlewares/verifyUserEmail');
const verifyEmailOwnership = require('../middlewares/verifyEmailOwnership');
const EmailSenderController = require('../controllers/emailSenderController');
const emailSenderController = new EmailSenderController();


const isURLWithHTTPorHTTPS = (value) => {
  console.log(value);
  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    throw new Error('URL base deve começar com http:// ou https://');
  }
  return true;
};

emailRouter.get('/bemvindo', emailController.bemvindo);

emailRouter.post('/direcionaremail',
  body('userEmail').isEmail().withMessage('Email inválido'),
  body('customName').isString().withMessage('Nome personalizado é obrigatório'),
  body('purpose').optional().isString().withMessage('Finalidade deve ser uma string'), 
  validateRequest,
  emailController.direcionarEmail
);

emailRouter.post('/enviar-token-verificacao',
  body('email').isEmail().withMessage('Email inválido'),
  body('baseUrl').custom(isURLWithHTTPorHTTPS).withMessage('URL base deve começar com http:// ou https://'),
  validateRequest,
  emailController.enviarTokenVerificacao
);

emailRouter.get('/validar-email/:token',
  param('token').isString().withMessage('Token inválido'),
  validateRequest,
  emailController.validarEmail
);

emailRouter.use(authenticate);

emailRouter.post('/criaremail',
  body('userEmail').isEmail().withMessage('Email inválido'),
  body('customName').isString().withMessage('Nome personalizado é obrigatório'),
  body('name').optional().isString().withMessage('Nome deve ser uma string'),
  body('senha').optional().isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres').trim().escape(),
  validateRequest,
  verifyUserEmail,
  emailController.criarEmail
);

emailRouter.put('/atualizarencaminhamento/:userId',
  body('userEmail').isEmail().withMessage('Email inválido'),
  body('clientEmail').isEmail().withMessage('Email do cliente é obrigatório'),
  body('forwardingEmail').isEmail().withMessage('Email de encaminhamento é obrigatório'),
  body('purpose').optional().isString().withMessage('Finalidade deve ser uma string'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  emailController.atualizarEncaminhamento
);

emailRouter.put('/cancelarencaminhamento/:userEmail/:clientEmail',
  param('userEmail').isEmail().withMessage('Email inválido'),
  param('clientEmail').isEmail().withMessage('Email do cliente é obrigatório'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  emailController.cancelarEncaminhamento
);

emailRouter.put('/reativarencaminhamento/:userEmail/:clientEmail',
  param('userEmail').isEmail().withMessage('Email inválido'),
  param('clientEmail').isEmail().withMessage('Email do cliente é obrigatório'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  emailController.reativarEncaminhamento
);

emailRouter.put('/excluiremail/:userEmail/:clientEmail',
  param('userEmail').isEmail().withMessage('Email inválido'),
  param('clientEmail').isEmail().withMessage('Email do cliente é obrigatório'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  emailController.excluirEmail
);

emailRouter.put('/reativaremail/:userEmail/:clientEmail',
  param('userEmail').isEmail().withMessage('Email inválido'),
  param('clientEmail').isEmail().withMessage('Email do cliente é obrigatório'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  emailController.reativarEmail
);



emailRouter.delete('/delete-email-temporario/:emailToDelete',
  param('emailToDelete').isEmail().withMessage('O parâmetro fornecido deve ser um endereço de e-mail válido.'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  verifyEmailOwnership, // Adiciona o middleware de verificação aqui
  emailController.deleteEmailTemporario
);

emailRouter.post('/enviar-email',
  body('userEmail').isEmail().withMessage('Email inválido'),
  body('clientEmail').isEmail().withMessage('Email do cliente é obrigatório'),
  body('subject').isString().withMessage('Assunto é obrigatório'),
  body('message').isString().withMessage('Mensagem é obrigatória'),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  verifyEmailOwnership,
  emailSenderController.sendEmail
);
module.exports = emailRouter;