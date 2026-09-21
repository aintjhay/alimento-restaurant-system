const crypto = require('node:crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { hashPassword } = require('../utils/authUtils');

const genericMessage = 'If an account exists for this email, we have sent a password reset link.';
const digest = token => crypto.createHash('sha256').update(token).digest('hex');

async function forgotPassword(req, res) {
  const email = req.body?.email;
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
  }
  let config;
  try { config = emailService.getEmailConfig(); } catch {
    return res.status(503).json({ success: false, message: 'Password reset email is not configured. Please contact the restaurant.' });
  }
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = digest(token);
    const user = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $set: { passwordResetTokenHash: tokenHash, passwordResetExpires: new Date(Date.now() + 15 * 60000) } },
      { new: true }
    );
    if (user) {
      try {
        await emailService.sendPasswordResetEmail(user.email, token, config);
      } catch {
        // Never log reset links, SMTP credentials, or provider responses.
        console.error('Password reset email delivery failed. Check SMTP configuration and provider availability.');
        await User.updateOne({ _id: user._id, passwordResetTokenHash: tokenHash },
          { $unset: { passwordResetTokenHash: '', passwordResetExpires: '' } });
      }
    }
    return res.json({ success: true, message: genericMessage });
  } catch {
    return res.status(503).json({ success: false, message: 'Password reset is temporarily unavailable. Please try again later.' });
  }
}

async function resetPassword(req, res) {
  const { token, password } = req.body || {};
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new link.' });
  }
  if (typeof password !== 'string' || password.length < 6 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'Use a password with at least 6 characters and at most 72 bytes.' });
  }
  try {
    const passwordHash = await hashPassword(password);
    // Atomically consume the token so simultaneous requests cannot reuse it.
    const user = await User.findOneAndUpdate(
      { passwordResetTokenHash: digest(token), passwordResetExpires: { $gt: new Date() } },
      { $set: { passwordHash }, $unset: { passwordResetTokenHash: '', passwordResetExpires: '' }, $inc: { sessionVersion: 1 } }
    );
    if (!user) return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new link.' });
    return res.json({ success: true, message: 'Your password has been reset. Please log in with your new password.' });
  } catch {
    return res.status(503).json({ success: false, message: 'Password reset is temporarily unavailable. Please try again later.' });
  }
}

module.exports = { forgotPassword, resetPassword };
