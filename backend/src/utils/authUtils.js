const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'alimento-secret-key-change-in-production';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Hash a password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, passwordHash) => {
  return bcrypt.compare(password, passwordHash);
};

/**
 * Generate JWT token
 */
const generateToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from request header
 */
const getTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.token || null;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  getTokenFromRequest,
  JWT_SECRET,
  JWT_EXPIRE
};
