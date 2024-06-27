// src/middlewares/validateRequest.js
const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  
  const errors = validationResult(req);
 
  if (!errors.isEmpty()) {
  
    return res.status(400).json({ 
      status: 'fail',
      errors: errors.array().map(err => err.msg),
    });
  }
  
  next();
};

module.exports = validateRequest;
