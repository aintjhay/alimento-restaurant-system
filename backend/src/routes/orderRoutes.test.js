const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('crypto');
const Order = require('../models/Order');
const router = require('./orderRoutes');

const handler = (path, method) => router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle;
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, set() { return this; }, json(body) { this.body = body; return this; } });

test('delivery creation discards forged guest identity and issues a random tracking secret', async t => {
  t.mock.method(Order.prototype, 'save', async function () { return this; });
  const res = response();
  await handler('/', 'post')({ body: {
    orderNumber: 'ORD-TEST', orderType: 'Delivery', deliveryType: 'registered',
    userId: '123456', customerContact: '09171234567', customerName: 'Guest',
    items: [], subtotal: 0, totalAmount: 50, paymentMethod: 'cash'
  } }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.order.deliveryType, 'guest');
  assert.equal(res.body.order.userId, undefined);
  assert.match(res.body.order.trackingToken, /^[a-f0-9]{64}$/);
  assert.equal(res.body.order.trackingTokenHash, undefined);
});

test('registered delivery identity comes from the verified session', async t => {
  t.mock.method(Order.prototype, 'save', async function () { return this; });
  const res = response();
  const userId = '507f1f77bcf86cd799439011';
  await handler('/', 'post')({ user: { userId, role: 'customer' }, body: {
    orderNumber: 'ORD-TEST', orderType: 'Delivery', userId: 'forged',
    customerContact: '09171234567', items: [], subtotal: 0, totalAmount: 50, paymentMethod: 'cash'
  } }, res);
  assert.equal(res.code, 201);
  assert.equal(String(res.body.order.userId), userId);
  assert.equal(res.body.order.deliveryType, 'registered');
});

test('tracking uses a hashed secret and selects only status fields', async t => {
  const token = 'ab'.repeat(32);
  t.mock.method(Order, 'findOne', query => {
    assert.deepEqual(query, { trackingTokenHash: createHash('sha256').update(token).digest('hex') });
    return { select(fields) {
      assert.equal(fields, 'orderNumber status paymentStatus paymentMethod estimatedCompletionTime updatedAt');
      return { lean: async () => ({ orderNumber: 'ORD-TEST', status: 'preparing' }) };
    } };
  });
  const res = response();
  await handler('/track/:token', 'get')({ params: { token } }, res);
  assert.equal(res.body.order.status, 'preparing');
});

test('invalid and unknown tracking secrets return 404', async t => {
  const find = t.mock.method(Order, 'findOne', () => ({ select: () => ({ lean: async () => null }) }));
  const invalid = response();
  await handler('/track/:token', 'get')({ params: { token: 'ORD-1' } }, invalid);
  assert.equal(invalid.code, 404);
  assert.equal(find.mock.callCount(), 0);
  const missing = response();
  await handler('/track/:token', 'get')({ params: { token: 'ab'.repeat(32) } }, missing);
  assert.equal(missing.code, 404);
});
