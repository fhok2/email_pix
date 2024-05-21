// src/controllers/paymentController.js

const PaymentService = require("../services/paymentService");
const AuthService = require("../services/authService");
const User = require("../models/User");
const socket = require("../../socket");
const { generateTempToken } = require("../services/tempTokenService");

module.exports = {
  async createPaymentGuest(req, res) {
    const { name, email, cpf, phone } = req.body;
    try {
      let user = await AuthService.findUserByEmail(email);

      // Se o usuário não existir, crie um novo usuário
      if (!user) {
        user = await AuthService.createUser({
          name,
          email,
          password: "", // Você pode gerar uma senha temporária ou deixar vazia
          role: "user",
        });
      }

      // Cria o pagamento associado ao userId do novo usuário
      const response = await PaymentService.createPaymentGuest({
        userId: user._id.toString(),
        name,
        email,
        cpf,
        phone,
      });
      res.status(response.code).json(response);
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao criar pagamento",
        data: error.message,
      });
    }
  },

  async createPaymentAuth(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          code: 404,
          status: "error",
          message: "Usuário não encontrado",
        });
      }

      const response = await PaymentService.createPaymentAuth({
        userId: user._id.toString(), // Passando o userId como string
        name: user.name,
        email: user.email,
        cpf: req.body.cpf, // CPF não será salvo
        phone: req.body.phone || user.phone, // Use o telefone fornecido ou o do banco de dados
      });

      // Atualizar o telefone do usuário no banco de dados, se fornecido
      if (req.body.phone) {
        user.phone = req.body.phone;
        await user.save();
      }

      res.status(response.code).json(response);
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao criar pagamento",
        data: error.message,
      });
    }
  },

  async handleWebhook(req, res) {
    try {
      const { event, charge } = req.body;
      const response = await PaymentService.handleWebhook(event, charge);
      if (response.code === 200) {
        const connectedSockets = socket.getConnectedSockets();
        const userSocket = connectedSockets.get(charge.transactionID);
        if (userSocket) {
          userSocket.emit("paymentStatus", {
            transactionID: charge.transactionID,
            status: "paid",
          });
        }
      }
      res.status(response.code).json(response);
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao processar webhook",
        data: error.message,
      });
    }
  },
  async startPaymentSession(req, res) {
    const { transactionID } = req.body;
    console.log(req.body)
    try {
      const tempToken = generateTempToken(transactionID);
      res.status(200).json({ tempToken });
    } catch (error) {
      console.error("Erro ao iniciar a sessão de pagamento:", error);
      res.status(500).json({
        code: 500,
        status: "error",
        message: "Erro ao iniciar a sessão de pagamento",
        data: error.message,
      });
    }
  },
};
