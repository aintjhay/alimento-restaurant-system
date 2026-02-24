const { verifyToken, getTokenFromRequest } = require('../utils/authUtils');

/**
 * Middleware to verify JWT token
 */
const authMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    next();
  } catch (error) {
    // Continue without auth if token invalid
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
