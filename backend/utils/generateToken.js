const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'default_jwt_secret_development_only', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

module.exports = generateToken; 