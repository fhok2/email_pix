const User = require('../models/User');
const emailServices = require('./emailServices');
const { generatePassword, hashPassword } = require('./passwordService');
const DOMINIO = require('../enums/dominio');
const logger = require('../utils/logger');
const { AppError } = require('../middlewares/errorHandler'); 

// Função para verificar se o ambiente é de produção
const isProduction = process.env.NODE_ENV === 'production';

// Função para verificar se o modo demo está ativado
const isDemo = process.env.IS_DEMO === 'true';

const criarEmail = async (userEmail, customName, name, senha) => {
  let localPart = customName || userEmail;
  if (localPart.includes("@")) {
    localPart = localPart.split("@")[0];
  }

  const fullEmailAddress = `${localPart}@${DOMINIO.PRINCIPAL}`;

  if (userEmail.endsWith(`@${DOMINIO.PRINCIPAL}`)) {
    return {
      code: 400,
      status: "error",
      message: `Não é permitido criar e-mails com o domínio ${DOMINIO.PRINCIPAL}.`,
    };
  }

  const existingUser = await User.findOne({ 'createdEmails.address': fullEmailAddress });
  if (existingUser) {
    const existingEmail = existingUser.createdEmails.find(email => email.address === fullEmailAddress);
    
    if (existingEmail.status === 'deleted') {
      // Reativar o e-mail deletado
      const reactivationResponse = await emailServices.criarEmail(fullEmailAddress);
      
      if (reactivationResponse.code === 200) {
        existingEmail.status = 'active';
        existingEmail.deletedAt = undefined;
        await existingUser.save();
        
        return {
          code: 200,
          status: "success",
          message: "E-mail reativado com sucesso.",
          data: { email: fullEmailAddress }
        };
      } else {
        return reactivationResponse;
      }
    } else {
      return {
        code: 400,
        status: "error",
        message: "E-mail já existe. Por favor, escolha outro nome.",
      };
    }
  }

  const password = senha || generatePassword();
  const hashedPassword = await hashPassword(password);

  let response = await emailServices.criarEmail(localPart, password);

  if (response.code === 404 || response.message === 'Email já existe') {
    return {
      code: 404,
      status: "error",
      message: "Erro ao criar o e-mail.",
      data: response.message,
    }
  }

  const user = await User.findOne({ email: userEmail });
  if (user) {
    if (!isDemo && user.plan === 'free' && user.createdEmails.filter(e => e.status !== 'deleted').length >= 3) {
      return {
        code: 403,
        status: "error",
        message: "Plano gratuito permite até 3 e-mails ativos.",
      };
    }
    user.createdEmails.push({ address: response.email, forwarding: userEmail, status: 'active' });
    await user.save();
  } else {
    if (!name) {
      return {
        code: 400,
        status: "error",
        message: "Nome do usuário é necessário para criar um novo usuário.",
      };
    }
    await User.create({ 
      name, 
      email: userEmail, 
      password: hashedPassword, 
      createdEmails: [{ address: response.email, forwarding: userEmail, status: 'active' }] 
    });
  }

  return response;
};

const createTemporaryEmail = async (dataCreateMailTemp) => {
  const { userEmail, customName } = dataCreateMailTemp;

  const user = await User.findOne({ email: userEmail });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Garante que o customName não inclua o domínio
  const localPart = customName.split('@')[0];
  const fullEmailAddress = `${localPart}@${DOMINIO.PRINCIPAL}`;

  try {
    // Create the email on the email server
    const response = await emailServices.criarEmail(localPart, generatePassword());

    if (response.code === 200) {
      // Adiciona o email temporário ao array de emails criados pelo usuário
      user.createdEmails.push({
        address: fullEmailAddress,
        forwarding: userEmail,
        status: 'active',
        isRedirect: false,
        isTemporary: true
      });
      await user.save();

      return {
        code: 200,
        status: "success",
        message: "Temporary email created successfully.",
        data: { email: fullEmailAddress }
      };
    } else {
      // Trata outros códigos de resposta de erro
      throw new AppError(response.message || 'Failed to create temporary email', response.code || 500);

    }
  } catch (error) {
    // Trata erros de 404 especificamente
    if (error.code === 404) {
      throw new AppError('Email already exists', 404);
    }
    // Lança qualquer outro erro
    throw new AppError(error.message || 'Failed to create temporary email', error.code || 500);
  }
};

const deleteEmailTemporario = async (userEmail, emailToDelete) => {
  console.log(`Attempting to delete temporary email: ${emailToDelete} for user: ${userEmail}`);

  const user = await User.findOne({ email: userEmail });
  if (!user) {
    console.log(`User not found: ${userEmail}`);
    throw new AppError('User not found', 404);
  }

  console.log(`User found. Checking for temporary email...`);
  const emailIndex = user.createdEmails.findIndex(e => e.address === emailToDelete && e.isTemporary);
  if (emailIndex === -1) {
    console.log(`Temporary email not found: ${emailToDelete}`);
    throw new AppError('Temporary email not found', 404);
  }

  try {
    console.log(`Calling email service to delete temporary email...`);
    await emailServices.deleteTemporaryEmail(emailToDelete);

    console.log(`Updating database...`);
    user.createdEmails[emailIndex].isTemporary = false;
    user.createdEmails[emailIndex].status = 'deleted';
    user.createdEmails[emailIndex].deletedAt = new Date();
    await user.save();

    console.log(`Temporary email deleted successfully: ${emailToDelete}`);
    return {
      code: 200,
      status: "success",
      message: "Temporary email deleted successfully and marked as non-temporary."
    };
  } catch (error) {
    console.error(`Error deleting temporary email: ${error.message}`);
    throw new AppError(error.message || 'Failed to delete temporary email', error.code || 500);
  }
};


const direcionarEmail = async (dataEmails) => {
  const { userEmail, customName, purpose } = dataEmails; // Adicione o campo 'purpose'

  // Verifica se os parâmetros obrigatórios estão presentes
  if (!userEmail || !customName) { // Verifique se 'userEmail' e 'customName' estão presentes
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

  // Verificação de limite de e-mails dependendo do ambiente
  if (isProduction && !isDemo) {
    if (user.plan === 'free' && user.createdEmails.length >= 3) {
      return {
        code: 403,
        status: "error",
        message: "Plano gratuito permite até 3 e-mails.",
      };
    }
  }

  const dataEmailsToService = { clientEmail: customName, userEmail, purpose: purpose || '' }; // Defina um valor padrão (em branco) se 'purpose' não estiver presente
  const response = await emailServices.direcionarEmail(dataEmailsToService);
  if (response.code === 200) {
    // Se o e-mail já existe para este usuário, atualize o encaminhamento
    const emailEntry = user.createdEmails.find(e => e.address === clientEmail);
    if (emailEntry) {
      emailEntry.forwarding = userEmail;
      emailEntry.purpose = purpose || ''; // Defina um valor padrão (em branco) se 'purpose' não estiver presente
    } else {
      user.createdEmails.push({ address: clientEmail, forwarding: userEmail, purpose: purpose || '' }); // Adicione o campo 'purpose' com um valor padrão (em branco) se 'purpose' não estiver presente
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

const atualizarEncaminhamento = async (userEmail, clientEmail, forwardingEmail, purpose) => {
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

  const dataEmailsToService = { clientEmail: clientEmail.split('@')[0], userEmail: forwardingEmail };
  const response = await emailServices.direcionarEmail(dataEmailsToService);
  if (response.code === 200) {
      emailEntry.forwarding = forwardingEmail;
      emailEntry.purpose = purpose; // Atualiza o propósito do encaminhamento
      await user.save();
      return {
          code: 200,
          status: "success",
          message: "Encaminhamento atualizado com sucesso.",
      };
  }
  return response;
};

const excluirEmail = async (userEmail, clientEmail) => {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  if (!user.createdEmails || !Array.isArray(user.createdEmails)) {
    throw new Error('Lista de emails criados não encontrada ou inválida');
  }

  const emailIndex = user.createdEmails.findIndex(e => e.address === clientEmail);
  if (emailIndex === -1) {
    throw new Error('E-mail não encontrado');
  }

  const email = user.createdEmails[emailIndex];

  if (email.status === 'active') {
    // Cancelar o encaminhamento no servidor de e-mail apenas se o status for 'active'
    await emailServices.cancelarEncaminhamento(clientEmail);
  }

  // Atualizar o status do e-mail no banco de dados
  email.status = 'deleted';
  email.deletedAt = new Date();
  await user.save();

  return {
    code: 200,
    status: "success",
    message: "E-mail excluído com sucesso",
  };
};

const reativarEmail = async (userEmail, clientEmail) => {
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  const emailIndex = user.createdEmails.findIndex(e => e.address === clientEmail && e.status === 'deleted');
  if (emailIndex === -1) {
    throw new Error('E-mail excluído não encontrado');
  }

  // Reativar o encaminhamento no servidor de e-mail
  await direcionarEmail({
    customName: clientEmail.split('@')[0],
    userEmail: userEmail,
    purpose: user.createdEmails[emailIndex].purpose
  });

  // Atualizar o status do e-mail no banco de dados
  user.createdEmails[emailIndex].status = 'active';
  user.createdEmails[emailIndex].deletedAt = undefined;
  await user.save();

  return {
    code: 200,
    status: "success",
    message: "E-mail reativado com sucesso",
  };
}


module.exports = {
  criarEmail,
  direcionarEmail,
  cancelarEncaminhamento,
  reativarEncaminhamento,
  atualizarEncaminhamento,
  excluirEmail,
  reativarEmail,
  deleteEmailTemporario,
  createTemporaryEmail,
};
