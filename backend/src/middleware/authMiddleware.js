const { verifyToken, getTokenFromRequest } = require('../utils/authUtils');

/**
 * Middleware to verify JWT token
 */
const authMiddleware = async (req, res, next) => {
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
    
    const user = await require('../models/User').findById(decoded.userId).select('role +sessionVersion');
    if (!user || user.role !== decoded.role || (user.sessionVersion || 0) !== (decoded.sessionVersion || 0)) {
      return res.status(401).json({ message: 'Session revoked. Please sign in again.' });
    }
    // Revalidate roles and revoked accounts on every authenticated request.
    req.user = decoded;
    next();
  } catch (error) {
    res.status(503).json({ success: false, message: 'Session verification temporarily unavailable.' });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 */
const optionalAuthMiddleware = (req, res, next) => getTokenFromRequest(req) ? authMiddleware(req, res, next) : next();

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource'
    });
  }
  next();
};

const adminMiddleware = [authMiddleware, requireRole('admin')];

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  adminMiddleware
};
