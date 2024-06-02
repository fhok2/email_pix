// src/services/emailServices.js

const User = require('../models/User');
const emailServices = require('./emailServices');
const { generatePassword, hashPassword } = require('./passwordService');
const DOMINIO = require('../enums/dominio');
const logger = require('../utils/logger');

const criarEmail = async (userEmail, customName, name, senha) => {
  let localPart = customName || userEmail;
  if (localPart.includes("@")) {
    localPart = localPart.split("@")[0];
  }

  if (userEmail.endsWith(`@${DOMINIO.PRINCIPAL}`)) {
    return {
      code: 400,
      status: "error",
      message: `Não é permitido criar e-mails com o domínio ${DOMINIO.PRINCIPAL}.`,
    };
  }

  const emailExists = await User.findOne({ 'createdEmails.address': `${localPart}@${DOMINIO.PRINCIPAL}` });
  if (emailExists) {
    return {
      code: 400,
      status: "error",
      message: "E-mail já existe. Por favor, escolha outro nome.",
    };
  }

  const password = senha || generatePassword();
  const hashedPassword = await hashPassword(password);

  let response = await emailServices.criarEmail(localPart, password);
  while (response.code === 404) {
    const adicionarNumero = Math.floor(Math.random() * 10);
    localPart += adicionarNumero;
    response = await emailServices.criarEmail(localPart, password);
  }

  const user = await User.findOne({ email: userEmail });
  if (user) {
    if (user.plan === 'free' && user.createdEmails.length >= 3) {
      return {
        code: 403,
        status: "error",
        message: "Plano gratuito permite até 3 e-mails.",
      };
    }
    user.createdEmails.push({ address: response.email, forwarding: userEmail });
    await user.save();
  } else {
    if (!name) {
      return {
        code: 400,
        status: "error",
        message: "Nome do usuário é necessário para criar um novo usuário.",
      };
    }
    await User.create({ name, email: userEmail, password: hashedPassword, createdEmails: [{ address: response.email, forwarding: userEmail }] });
  }

  return response;
};

const direcionarEmail = async (dataEmails) => {
  const { userEmail, customName } = dataEmails;

  // Verifica se os parâmetros obrigatórios estão presentes
  if (!userEmail || !customName) {
    return {
      code: 400,
      status: "error",
      message: "Os campos userEmail e customName são obrigatórios.",
    };
  }

  const clientEmail = `${customName.split('@')[0]}@${DOMINIO.PRINCIPAL}`;

  // Verifica se o email já está registrado
  const existingUser = await User.findOne({ 'createdEmails.address': clientEmail });

  if (existingUser) {
    if (existingUser.email !== userEmail) {
      return {
        code: 400,
        status: "error",
        message: `E-mail ${clientEmail} já está em uso.`,
      };
    }
  }

  let user = await User.findOne({ email: userEmail });
  if (!user) {
    const name = userEmail.split('@')[0]; // Usar a parte inicial do email como nome
    const newUser = await User.create({
      name,
      email: userEmail,
      createdEmails: [],
      plan: 'free',
      paymentDate: new Date()
    });
    user = newUser;
  }

  if (user.plan === 'free' && user.createdEmails.length >= 3) {
    return {
      code: 403,
      status: "error",
      message: "Plano gratuito permite até 3 e-mails.",
    };
  }

  const dataEmailsToService = { clientEmail: customName, userEmail };
  const response = await emailServices.direcionarEmail(dataEmailsToService);
  if (response.code === 200) {
    // Se o e-mail já existe para este usuário, atualize o encaminhamento
    const emailEntry = user.createdEmails.find(e => e.address === clientEmail);
    if (emailEntry) {
      emailEntry.forwarding = userEmail;
    } else {
      user.createdEmails.push({ address: clientEmail, forwarding: userEmail });
    }
    await user.save();
    return {
      code: 200,
      status: "success",
      message: "E-mail direcionado com sucesso.",
      data: { address: clientEmail }
    };
  }

  return response;
};

const cancelarEncaminhamento = async (userEmail, clientEmail) => {
  const user = await User.findOne({ email: userEmail });
  const emailEntry = user.createdEmails.find(e => e.address === clientEmail);
  if (emailEntry) {
    const response = await emailServices.cancelarEncaminhamento(clientEmail);
    if (response.code === 200) {
      emailEntry.status = 'inactive';
      await user.save();
      return {
        code: 200,
        status: "success",
        message: "Encaminhamento cancelado com sucesso.",
      };
    }
    return response;
  }
  return {
    code: 404,
    status: "error",
    message: "E-mail não encontrado.",
  };
};

const reativarEncaminhamento = async (userEmail, clientEmail) => {
  const user = await User.findOne({ email: userEmail });
  const emailEntry = user.createdEmails.find(e => e.address === clientEmail && e.status === 'inactive');
  if (emailEntry) {
    const response = await emailServices.direcionarEmail({ clientEmail: clientEmail.replace('@'+DOMINIO.PRINCIPAL, ''), userEmail });
    if (response.code === 200) {
      emailEntry.status = 'active';
      await user.save();
      return {
        code: 200,
        status: "success",
        message: "Encaminhamento reativado com sucesso.",
      };
    }
    return response;
  }
  return {
    code: 404,
    status: "error",
    message: "E-mail não encontrado ou já está ativo.",
  };
};

const atualizarEncaminhamento = async (userEmail, clientEmail, forwardingEmail) => {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    return {
      code: 404,
      status: "error",
      message: "Usuário não encontrado.",
    };
  }

  const emailEntry = user.createdEmails.find(e => e.address === clientEmail );
  if (!emailEntry) {
    return {
      code: 404,
      status: "error",
      message: "E-mail não encontrado ou não está vinculado ao usuário.",
    };
  }
  
const dataEmailsToService = { clientEmail:clientEmail.split('@')[0], userEmail: forwardingEmail };
  const response = await emailServices.direcionarEmail(dataEmailsToService);
  if (response.code === 200) {
    emailEntry.forwarding = forwardingEmail;
    await user.save();
    return {
      code: 200,
      status: "success",
      message: "Encaminhamento atualizado com sucesso.",
    };
  }
  return response;
};

const listarUsuarios = async () => {
  const users = await User.find({}, 'name email plan paymentDate');
  return {
    code: 200,
    status: 'success',
    data: users,
  };
};

const atualizarPlano = async (userId, novoPlano) => {
  const user = await User.findById(userId);
  if (!user) {
    return {
      code: 404,
      status: 'error',
      message: 'Usuário não encontrado',
    };
  }

  user.plan = novoPlano;
  if (novoPlano === 'paid') {
    user.paymentDate = new Date();
  }
  await user.save();

  return {
    code: 200,
    status: 'success',
    message: 'Plano atualizado com sucesso',
  };
};

// Novo método para listar os e-mails do usuário
const listarEmailsUsuario = async (userId) => {
  const user = await User.findById(userId).select('createdEmails');
  if (!user) {
    return {
      code: 404,
      status: 'error',
      message: 'Usuário não encontrado',
    };
  }

  return {
    code: 200,
    status: 'success',
    data: user.createdEmails,
  };
};

module.exports = {
  criarEmail,
  direcionarEmail,
  cancelarEncaminhamento,
  reativarEncaminhamento,
  atualizarEncaminhamento,
  listarUsuarios,
  atualizarPlano,
  listarEmailsUsuario,
};
