const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  logout
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Public routes
 */

// Register new user
router.post('/register', register);

// Login user
router.post('/login', login);

// Logout user
router.post('/logout', logout);

/**
 * Protected routes (require authentication)
 */

// Get current user profile
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
