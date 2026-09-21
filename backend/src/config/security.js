function validateSecurity() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32 || secret === 'alimento-secret-key-change-in-production') {
    throw new Error('JWT_SECRET must be a private random secret of at least 32 characters.');
  }
}
module.exports = { validateSecurity };
