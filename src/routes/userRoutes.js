const express = require('express');
const { body } = require('express-validator');
const validateRequest = require('../middlewares/validateRequest');
const UserController = require('../controllers/userController');
const router = express.Router();
const userController = new UserController();

router.post(
  '/register',
  [
    body('name').isLength({ min: 1 }).withMessage('Nome é obrigatório').trim().escape(),
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('A senha deve ter no mínimo 6 caracteres').trim().escape(),
    body('phone').optional().isMobilePhone('pt-BR').withMessage('Número de telefone inválido'),
  ],
  validateRequest,
  (req, res) => userController.register(req, res)
);

router.put('/update/:id',
  [
    body('name').isLength({ min: 1 }).withMessage('Nome é obrigatório').trim().escape(),
    body('phone').optional().isMobilePhone('pt-BR').withMessage('Número de telefone inválido'),
  ],
  validateRequest,
  (req, res) => userController.update(req, res)
);  

router.post(
  '/check-email',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  ],
  validateRequest,
  (req, res) => userController.checkEmail(req, res)
);

module.exports = router;
