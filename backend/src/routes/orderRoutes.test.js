const test = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('crypto');
const Order = require('../models/Order');
const router = require('./orderRoutes');
const StoreSettings = require('../models/StoreSettings');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const proof = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
const productId = '507f1f77bcf86cd799439012';
function mockCheckout(t) {
  process.env.JWT_SECRET = 'unit-test-private-secret-123456789012345';
  t.mock.method(require('mongoose').connection, 'transaction', async fn => fn(undefined));
  t.mock.method(require('../models/Counter'), 'findOneAndUpdate', async () => ({ value: 1 }));
  t.mock.method(Order, 'findOne', () => ({ select: async () => null }));
  t.mock.method(StoreSettings, 'current', async () => ({ openingTime: '00:00', closingTime: '23:59', gcashQr: proof, promotions: [] }));
  t.mock.method(MenuItem, 'find', () => ({ lean: async () => [{ _id: productId, name: 'Food', price: 100, modifiers: [], addons: [] }] }));
  t.mock.method(Inventory, 'findOne', () => ({ session: async () => null }));
}


const handler = (path, method) => (req, res) => { req.get = () => 'unit-test-idempotency-key'; return router.stack.find(layer => layer.route?.path === path && layer.route.methods[method]).route.stack.at(-1).handle(req, res); };
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, set() { return this; }, json(body) { this.body = body; return this; } });

test('delivery creation discards forged guest identity and issues a random tracking secret', async t => {
  mockCheckout(t);
  t.mock.method(Order.prototype, 'save', async function () { return this; });
  const res = response();
  await handler('/', 'post')({ body: {
    orderNumber: 'ORD-TEST', orderType: 'Delivery', deliveryType: 'registered',
    userId: '123456', customerContact: '09171234567', customerName: 'Guest',
    items: [{ menuItemId: productId, quantity: 1 }], subtotal: 100, totalAmount: 150, paymentMethod: 'gcash', paymentProof: proof
  } }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.order.deliveryType, 'guest');
  assert.equal(res.body.order.userId, undefined);
  assert.match(res.body.order.trackingToken, /^[a-f0-9]{64}$/);
  assert.equal(res.body.order.trackingTokenHash, undefined);
});

test('registered delivery identity comes from the verified session', async t => {
  mockCheckout(t);
  t.mock.method(Order.prototype, 'save', async function () { return this; });
  const res = response();
  const userId = '507f1f77bcf86cd799439011';
  await handler('/', 'post')({ user: { userId, role: 'customer' }, body: {
    orderNumber: 'ORD-TEST', orderType: 'Delivery', userId: 'forged',
    customerContact: '09171234567', items: [{ menuItemId: productId, quantity: 1 }], subtotal: 100, totalAmount: 150, paymentMethod: 'gcash', paymentProof: proof
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
      assert.equal(fields, 'orderNumber orderType status paymentStatus paymentMethod estimatedCompletionTime updatedAt rating');
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

test('portal rejects cash and missing receipt before stock or order creation', async t => {
  mockCheckout(t);
  for (const payment of [{ paymentMethod: 'cash', paymentProof: proof }, { paymentMethod: 'gcash' }]) {
    const res = response();
    await handler('/', 'post')({ body: { orderType: 'Delivery', ...payment } }, res);
    assert.equal(res.code, 400);
  }
});

test('portal cannot forge paid status or a discount and stale totals require review', async t => {
  mockCheckout(t);
  t.mock.method(Order.prototype, 'save', async function () { return this; });
  const body = { orderNumber: 'ORD-TEST', orderType: 'Delivery', customerContact: '09171234567', items: [{ menuItemId: productId, quantity: 1 }], totalAmount: 150, paymentMethod: 'gcash', paymentProof: proof, paymentStatus: 'paid', discount: 999 };
  const res = response();
  await handler('/', 'post')({ body }, res);
  assert.equal(res.code, 201);
  assert.equal(res.body.order.paymentStatus, 'payment_pending_verification');
  assert.equal(res.body.order.discount, 0);
  assert.equal(res.body.order.paymentProof, undefined);
  const stale = response();
  await handler('/', 'post')({ body: { ...body, totalAmount: 1 } }, stale);
  assert.equal(stale.code, 409);
});

test('handing all delivery items to rider sets out for delivery, not completed', async t => {
  const order = new Order({ orderType: 'Delivery', status: 'ready', items: [{ menuItemId: productId, name: 'Food', price: 100, quantity: 1, itemTotal: 100, itemStatus: 'ready' }], subtotal: 100, totalAmount: 150 });
  t.mock.method(require('mongoose').connection, 'transaction', async fn => fn(undefined));
  t.mock.method(Order, 'findById', () => ({ session: async () => order }));
  t.mock.method(Order.prototype, 'save', async function () { return this; });
  const res = response();
  await handler('/:id/status', 'patch')({ params: { id: String(order._id) }, user: { userId: 'admin', role: 'admin' }, body: { itemIndex: 0, status: 'served' } }, res);
  assert.equal(res.body.order.status, 'out_for_delivery');
  assert.equal(res.body.order.completedAt, undefined);
  assert.equal(res.body.order.statusTimeline.at(-1).status, 'out_for_delivery');
});

test('rating requires completed unrated order and accepts a low rating', async t => {
  t.mock.method(Order, 'findOneAndUpdate', async (query, update) => {
    assert.equal(query.status, 'completed');
    assert.deepEqual(query.rating, { $exists: false });
    assert.equal(update.$set.rating, 1);
    return { rating: 1 };
  });
  const res = response();
  await handler('/track/:token/rating', 'post')({ params: { token: 'ab'.repeat(32) }, body: { rating: 1 } }, res);
  assert.equal(res.body.rating, 1);
  const invalid = response();
  await handler('/track/:token/rating', 'post')({ params: { token: 'ab'.repeat(32) }, body: { rating: 6 } }, invalid);
  assert.equal(invalid.code, 400);
});
