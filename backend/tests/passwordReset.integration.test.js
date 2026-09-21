const { test, before, after, beforeEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
process.env.MONGOMS_DOWNLOAD_DIR = path.join(__dirname, '../mongodb-binaries');
process.env.JWT_SECRET = 'password-reset-test-secret-12345678901234567890';
Object.assign(process.env, { SMTP_HOST: 'smtp.example.com', SMTP_PORT: '465', SMTP_USER: 'sender', SMTP_PASS: 'test', MAIL_FROM: 'sender@example.com', FRONTEND_URL: 'http://localhost:3000' });
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const User = require('../src/models/User');
const emailService = require('../src/services/emailService');
const { forgotPassword, resetPassword } = require('../src/controllers/passwordResetController');
const { hashPassword, comparePassword, generateToken } = require('../src/utils/authUtils');
const { authMiddleware } = require('../src/middleware/authMiddleware');
let db, server, base, sent;
before(async () => {
  db = await MongoMemoryServer.create({ binary: { version: '7.0.14' } });
  await mongoose.connect(db.getUri());
  const app = express(); app.use(express.json());
  app.post('/forgot', forgotPassword); app.post('/reset', resetPassword);
  app.get('/protected', authMiddleware, (req, res) => res.json({ success: true }));
  app.use('/api/auth', require('../src/routes/authRoutes'));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}, { timeout: 180000 });
after(async () => {
  mock.restoreAll();
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect(); if (db) await db.stop();
});
beforeEach(async () => {
  mock.restoreAll(); sent = [];
  mock.method(emailService, 'sendPasswordResetEmail', async (email, token) => { sent.push({ email, token }); });
  await User.deleteMany({});
  await User.create({ firstName: 'Reset', lastName: 'Test', email: 'customer@example.com', passwordHash: await hashPassword('old-password') });
});
async function post(route, body) {
  const response = await fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}
test('reset hashes the token, consumes it once, replaces password and revokes sessions', async () => {
  const user = await User.findOne();
  const jwt = generateToken(user._id, user.email, user.role);
  const known = await post('/forgot', { email: ' CUSTOMER@example.com ' });
  const unknown = await post('/forgot', { email: 'unknown@example.com' });
  assert.deepEqual(known, unknown); assert.equal(sent.length, 1);
  const { token } = sent[0];
  const stored = await User.findOne().select('+passwordResetTokenHash +passwordResetExpires');
  assert.equal(stored.passwordResetTokenHash, crypto.createHash('sha256').update(token).digest('hex'));
  assert.ok(stored.passwordResetExpires > new Date());
  assert.equal((await User.findOne()).passwordResetTokenHash, undefined);
  const results = await Promise.all([post('/reset', { token, password: 'new-password' }), post('/reset', { token, password: 'new-password' })]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
  const updated = await User.findOne().select('+passwordHash +passwordResetTokenHash +sessionVersion');
  assert.equal(await comparePassword('new-password', updated.passwordHash), true);
  assert.equal(await comparePassword('old-password', updated.passwordHash), false);
  assert.equal(updated.passwordResetTokenHash, undefined); assert.equal(updated.sessionVersion, 1);
  assert.equal((await fetch(base + '/protected', { headers: { Authorization: `Bearer ${jwt}` } })).status, 401);
});
test('new links replace old links and expired links fail', async () => {
  await post('/forgot', { email: 'customer@example.com' });
  await post('/forgot', { email: 'customer@example.com' });
  assert.equal((await post('/reset', { token: sent[0].token, password: 'new-password' })).status, 400);
  await User.updateOne({}, { $set: { passwordResetExpires: new Date(Date.now() - 1000) } });
  assert.equal((await post('/reset', { token: sent[1].token, password: 'new-password' })).status, 400);
});
test('invalid inputs are rejected without sending mail or consuming a valid token', async () => {
  assert.equal((await post('/forgot', { email: { $ne: null } })).status, 400);
  await post('/forgot', { email: 'customer@example.com' });
  const { token } = sent[0];
  for (const password of ['short', 'é'.repeat(40), {}]) assert.equal((await post('/reset', { token, password })).status, 400);
  assert.equal((await post('/reset', { token: 'bad', password: 'new-password' })).status, 400);
  assert.equal((await post('/reset', { token, password: 'new-password' })).status, 200);
});
test('failed delivery removes the token and returns the generic response', async () => {
  mock.method(emailService, 'sendPasswordResetEmail', async () => { throw new Error('SMTP failed'); });
  mock.method(console, 'error', () => {});
  const known = await post('/forgot', { email: 'customer@example.com' });
  assert.deepEqual(known, await post('/forgot', { email: 'unknown@example.com' }));
  assert.equal((await User.findOne().select('+passwordResetTokenHash')).passwordResetTokenHash, undefined);
});
test('missing configuration is reported for every account', async () => {
  mock.method(emailService, 'getEmailConfig', () => { throw new Error('missing'); });
  const known = await post('/forgot', { email: 'customer@example.com' });
  assert.equal(known.status, 503);
  assert.deepEqual(known, await post('/forgot', { email: 'unknown@example.com' }));
});
test('public reset endpoints enforce rate limits', async () => {
  for (let i = 0; i < 10; i++) await post('/api/auth/forgot-password', { email: 'unknown@example.com' });
  const result = await post('/api/auth/reset-password', { token: 'bad', password: 'new-password' });
  assert.equal(result.status, 429); assert.equal(result.body.success, false);
});
