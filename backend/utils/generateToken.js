const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token for a given user ID.
 * @param {string} id - MongoDB user ObjectId
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key_change_in_production', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

module.exports = generateToken;
