const express = require('express');
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  getCurrentUser,
  logout
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');

const resetLimiter = require('express-rate-limit')({
  windowMs: 15 * 60000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Too many password reset attempts. Please try again in 15 minutes.' }
});
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', resetLimiter, resetPassword);

/**
 * Public routes
 */

const loginLimiter = require('express-rate-limit')({ windowMs: 15 * 60000, max: 20, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false });
router.use(['/login', '/admin/login', '/register'], loginLimiter);

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);
router.post('/admin/login', adminLogin);

// Logout user
router.post('/logout', authMiddleware, logout);

/**
 * Protected routes (require authentication)
 */

// Get current user profile
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
