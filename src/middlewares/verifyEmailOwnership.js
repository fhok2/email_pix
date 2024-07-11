const { verifyToken } = require('../services/authService');
const User = require('../models/User');
const { AppError } = require('../middlewares/errorHandler');

async function verifyEmailOwnership(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new AppError('Authentication token is required', 401);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verifica o email dependendo da rota
    const emailToVerify = req.params.emailToDelete || req.body.userEmail;

    if (!emailToVerify) {
      throw new AppError('Email to verify is required', 400);
    }
   
    const emailExists = user.createdEmails.some(email => email.address === String(emailToVerify));

    if (!emailExists) {
      throw new AppError('You do not have permission to manage this email', 403);
    }

    req.user = user; 
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = verifyEmailOwnership;
