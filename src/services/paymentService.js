// src/services/paymentService.js

const fetch = require('node-fetch');
const uuid = require('uuid');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Plano = require('../enums/plano');
require('dotenv').config();

const API_URL = 'https://api.openpix.com.br/api/v1/charge?return_existing=true';

class UserNotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserNotFoundError';
    this.statusCode = 404;
  }
}

const createPaymentGuest = async ({ userId, name, email, cpf, phone }) => {
  const correlationID = uuid.v4();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `${process.env.PIX_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      correlationID,
      value: Plano.price,
      comment: Plano.name,
      customer: {
        name,
        taxID: cpf,
        email,
        phone
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create payment: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();

  const payment = new Payment({
    userId, // Certificando-se de que userId está sendo passado corretamente
    name,
    email,
    phone,
    amount: Plano.price,
    correlationID,
    transactionID: data.charge.transactionID,
    paymentLink: data.charge.paymentLinkUrl,
    pixCode: data.charge.brCode,
    status: 'pending'
  });

  await payment.save();

  // Associar o pagamento ao usuário
  await User.findByIdAndUpdate(userId, { $push: { payments: payment._id } });

  return {
    code: 201,
    status: 'success',
    message: 'Payment created successfully',
    data: {
      name,
      email,
      phone,
      amount: Plano.price,
      correlationID,
      transactionID: data.charge.transactionID,
      paymentLink: data.charge.paymentLinkUrl,
      pixCode: data.charge.brCode,
      qrCodeImage: data.charge.qrCodeImage,
      expiresDate: data.charge.expiresDate,
      comment: data.charge.comment,
      status: 'pending'
    }
  };
};

const createPaymentAuth = async ({ userId, name, email, cpf, phone }) => {
  const correlationID = uuid.v4();

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `${process.env.PIX_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      correlationID,
      value: Plano.price,
      comment: Plano.name,
      customer: {
        name,
        taxID: cpf,
        email,
        phone
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to create payment: ${response.status} ${response.statusText} - ${errorData}`);
  }

  const data = await response.json();

  const payment = new Payment({
    userId, // Certificando-se de que userId está sendo passado corretamente
    name,
    email,
    phone,
    amount: Plano.price,
    correlationID,
    transactionID: data.charge.transactionID,
    paymentLink: data.charge.paymentLinkUrl,
    pixCode: data.charge.brCode,
    status: 'pending'
  });

  await payment.save();

  // Associar o pagamento ao usuário
  await User.findByIdAndUpdate(userId, { $push: { payments: payment._id } });

  return {
    code: 201,
    status: 'success',
    message: 'Payment created successfully',
    data: {
      name,
      email,
      phone,
      amount: Plano.price,
      correlationID,
      transactionID: data.charge.transactionID,
      paymentLink: data.charge.paymentLinkUrl,
      pixCode: data.charge.brCode,
      qrCodeImage: data.charge.qrCodeImage,
      expiresDate: data.charge.expiresDate,
      comment: data.charge.comment,
      status: 'pending'
    }
  };
};

const updatePaymentStatus = async (transactionID, status) => {
  const payment = await Payment.findOne({ transactionID });
  if (!payment) {
    throw new Error('Pagamento não encontrado');
  }
  payment.status = status;
  await payment.save();

  // Atualize o plano do usuário se o pagamento foi bem-sucedido
  if (status === 'paid') {
    await User.findByIdAndUpdate(payment.userId, {
      plan: 'paid',
      paymentDate: new Date(),
    });
  }
};

const handleWebhook = async (event, charge) => {
  if (event === 'OPENPIX:CHARGE_COMPLETED' && charge.status === 'COMPLETED') {
    await updatePaymentStatus(charge.transactionID, 'paid');
    return {
      code: 200,
      status: 'success',
      message: 'Webhook recebido com sucesso'
    };
  }

  return {
    code: 400,
    status: 'fail',
    message: 'Evento ou status do webhook inválido'
  };
};

module.exports = {
  createPaymentGuest,
  createPaymentAuth,
  updatePaymentStatus,
  handleWebhook,
  UserNotFoundError
};
