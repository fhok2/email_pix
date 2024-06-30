const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');

function generatePassword(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function validatePassword(email, password) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('User not found');
  }
  return bcrypt.compare(password, user.password);
}

module.exports = {
  generatePassword,
  hashPassword,
  validatePassword,
};
