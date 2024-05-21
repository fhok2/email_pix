const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateTempToken = (transactionID) => {
  return jwt.sign({ transactionID }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

const validateTempToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateTempToken, validateTempToken };
