const AdminServices = require('../services/adminServices');

module.exports = class AdminController{
  async listarUsuarios(req, res) {
    try {
      const response = await AdminServices.listarUsuarios();
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao listar usuários:', error);
      res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Erro ao listar usuários',
        data: error.message,
      });
    }
  }
  async atualizarPlano(req, res) {
    const { userId, novoPlano } = req.body;
    try {
      const response = await AdminServices.atualizarPlano(userId, novoPlano);
      res.status(response.code).json(response);
    } catch (error) {
      logger.error('Erro ao atualizar o plano:', error);
      res.status(500).json({
        code: 500,
        status: 'error',
        message: 'Erro ao atualizar o plano',
        data: error.message,
      });
    }
  }
}