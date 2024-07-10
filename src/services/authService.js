const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
  });
  
}

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, plan: user.plan },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, plan: user.plan },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const hashPassword = (password) => {
  return bcrypt.hash(password, 12);
};

const comparePassword = (password, hash) => {
  return bcrypt.compare(password, hash);
};

const createUser = (userData) => {
  if (userData.role === 'admin') {
    userData.permissions = ['admin', 'create_payment', 'update_payment', 'delete_payment'];
  } else {
    userData.permissions = ['create_payment'];
  }
  return User.create(userData);
};

const renewTokens = async (refreshToken) => {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await findUserByEmail(decoded.email);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }
    if (user.refreshToken !== refreshToken) {
      throw new Error('Refresh token não corresponde ao armazenado para o usuário.');
    }
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    await user.save();
    return { newAccessToken, newRefreshToken };
  } catch (error) {
    console.error('Erro ao renovar os tokens:', error);
    throw new Error(`Erro ao renovar os tokens: ${error.message}`);
  }
};

const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

const resetPassword = async (token, newPassword) => {
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    const error = new Error("Token inválido ou expirado.");
    error.statusCode = 400;
    throw error;
  }
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return user;
};

const verifyFirebaseToken = async (idToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Erro ao verificar token do Firebase:', error);
    throw new Error('Falha na verificação do token do Firebase.');
  }
};

const createUserFromFirebase = async (firebaseUser) => {
  const newUser = new User({
    name: firebaseUser.name || firebaseUser.email.split('@')[0],
    email: firebaseUser.email,
    emailVerified: true,
    role: 'user',
    plan: 'free',
    permissions: ['create_payment'],
    
  });
  return await newUser.save();
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  findUserByEmail,
  createUser,
  renewTokens,
  resetPassword,
  createUserFromFirebase,
  verifyFirebaseToken,
};