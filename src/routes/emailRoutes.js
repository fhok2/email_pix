const express = require('express');
const { body, param } = require('express-validator');
const emailRouter = express.Router();
const EmailController = require('../controllers/emailController');
const emailController = new EmailController();
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const verifyUserEmail = require('../middlewares/verifyUserEmail');

emailRouter.get('/bemvindo', emailController.bemvindo);

emailRouter.post('/direcionaremail',
  body('userEmail').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('customName').isString().withMessage('Nome personalizado é obrigatório'),
  body('purpose').optional().isString().withMessage('Finalidade deve ser uma string'), // Validação opcional para 'purpose'
  validateRequest,
  emailController.direcionarEmail
);


emailRouter.use(authenticate);

emailRouter.post('/criaremail',
  body('userEmail').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('customName').isString().withMessage('Nome personalizado é obrigatório'),
  body('name').optional().isString().withMessage('Nome deve ser uma string'),
  body('senha').optional().isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres').trim().escape(),
  validateRequest,
  verifyUserEmail,
  emailController.criarEmail
);


emailRouter.put('/atualizarencaminhamento/:userId',
  body('userEmail').isEmail().withMessage('Email inválido').normalizeEmail(),
  body('clientEmail').isEmail().withMessage('Email do cliente é obrigatório').normalizeEmail(),
  body('forwardingEmail').isEmail().withMessage('Email de encaminhamento é obrigatório').normalizeEmail(),
  body('purpose').optional().isString().withMessage('Finalidade deve ser uma string'),
  validateRequest,
  authenticate, // Proteger a rota com autenticação
  authorize(['admin', 'user']), // Proteger a rota com autorização (admin ou user)
  emailController.atualizarEncaminhamento
  );
  
  
  emailRouter.put(
    '/cancelarencaminhamento/:userEmail/:clientEmail',
    param('userEmail').isEmail().withMessage('Email inválido').normalizeEmail(),
    param('clientEmail').isEmail().withMessage('Email do cliente é obrigatório').normalizeEmail(),
    validateRequest,
    authenticate,
    authorize(['admin', 'user']),
    emailController.cancelarEncaminhamento
  );

emailRouter.put(
  '/reativarencaminhamento/:userEmail/:clientEmail',
  param('userEmail').isEmail().withMessage('Email inválido').normalizeEmail(),
  param('clientEmail').isEmail().withMessage('Email do cliente é obrigatório').normalizeEmail(),
  validateRequest,
  authenticate,
  authorize(['admin', 'user']),
  emailController.reativarEncaminhamento
);

// Nova rota protegida para exibir os e-mails e direcionamentos do usuário
emailRouter.get('/listaremailusuario', authenticate, emailController.listarEmailsUsuario);

// Aplicando o middleware de autorização para verificar permissões de administrador
emailRouter.use(authorize(['admin']));

emailRouter.get('/listarusuarios', emailController.listarUsuarios);

emailRouter.post('/atualizarplano',
  body('userId').isMongoId().withMessage('ID de usuário inválido'),
  body('novoPlano').isString().withMessage('Novo plano é obrigatório'),
  validateRequest,
  emailController.atualizarPlano
);




module.exports = emailRouter;