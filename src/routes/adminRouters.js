const express = require('express');
const { body } = require('express-validator');
const adminRouter = express.Router();
const AdminController = require('../controllers/adminController');
const authenticate = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const validateRequest = require('../middlewares/validateRequest');
const adminController = new AdminController();

adminRouter.use(authenticate);
adminRouter.use(authorize(['admin']));
adminRouter.get('/listarusuarios', adminController.listarUsuarios);
adminRouter.post('/atualizarplano',
  body('userId').isMongoId().withMessage('ID de usuário inválido'),
  body('novoPlano').isString().withMessage('Novo plano é obrigatório'),
  validateRequest,
  adminController.atualizarPlano
);

module.exports = adminRouter;