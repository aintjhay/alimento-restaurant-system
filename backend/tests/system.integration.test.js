const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const crypto = require('node:crypto');
process.env.JWT_SECRET = 'integration-test-secret-never-for-production-123456';
process.env.PAYMONGO_SECRET_KEY = 'sk_test_fixture';
process.env.PAYMONGO_WEBHOOK_SECRET = 'fixture-webhook-secret';
process.env.MONGOMS_DOWNLOAD_DIR = path.join(__dirname, '../mongodb-binaries');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { app } = require('../server');
const User = require('../src/models/User');
const Order = require('../src/models/Order');
const MenuItem = require('../src/models/MenuItem');
const Inventory = require('../src/models/Inventory');
const StockMovement = require('../src/models/StockMovement');
const Payment = require('../src/models/Payment');
const Settings = require('../src/models/StoreSettings');
const { generateToken } = require('../src/utils/authUtils');
let repl, server, base, admin, customer, kitchen, product;
const proof = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';
before(async () => {
  repl = await MongoMemoryReplSet.create({ binary: { version: '7.0.14' }, replSet: { count: 1, storageEngine: 'wiredTiger' } });
  await mongoose.connect(repl.getUri(), { dbName: 'hardening-tests' });
  for (const name of ['Counter', 'StockMovement', 'CheckoutAttempt']) require('../src/models/' + name);
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
}, { timeout: 180000 });
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); await mongoose.disconnect(); if (repl) await repl.stop(); });
beforeEach(async () => {
  for (const model of Object.values(mongoose.models)) await model.deleteMany({});
  const users = await User.create(['admin', 'customer', 'kitchen'].map(role => ({ firstName: role, lastName: 'Test', email: `${role}@test.invalid`, role, passwordHash: 'sensitive-hash' })));
  [admin, customer, kitchen] = users.map(u => ({ id: String(u._id), token: generateToken(u._id, u.email, u.role) }));
  product = await MenuItem.create({ name: 'Coffee', category: 'Coffee', price: 100 });
  await Inventory.create({ name: 'Coffee', productId: product._id, currentStock: 10, batches: [{ quantity: 10, label: 'Batch A' }] });
  await Settings.create({ key: 'store', openingTime: '00:00', closingTime: '23:59', closedDays: [], gcashQr: proof });
});
async function request(url, { user, body, method = 'GET', key, headers = {} } = {}) {
  const response = await fetch(base + url, { method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}), ...(key ? { 'Idempotency-Key': key } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
  return { status: response.status, data };
}
const payload = (more = {}) => ({ orderType: 'Dine-in', items: [{ menuItemId: String(product._id), quantity: 1 }], totalAmount: 100, paymentMethod: 'cash', paymentStatus: 'unpaid', ...more });
const create = (body = payload(), key = crypto.randomUUID()) => request('/api/orders', { user: admin, method: 'POST', key, body });
test('maintenance routes removed; profiles, history and forecasts require authentication', async () => {
  for (const url of ['/api/seed', '/api/force-reseed', '/api/orders/migrate/link-users']) assert.equal((await request(url, { method: 'POST', body: {} })).status, 404);
  for (const url of [`/api/users/${customer.id}`, `/api/orders/user/${customer.id}`, '/api/forecast']) assert.equal((await request(url)).status, 401);
  assert.equal((await request(`/api/users/${customer.id}`, { user: admin })).status, 403);
  const profile = await request(`/api/users/${customer.id}`, { user: customer });
  assert.equal(profile.status, 200); assert.equal(profile.data.user.passwordHash, undefined);
  assert.equal((await request(`/api/users/${admin.id}/addresses`, { user: customer, method: 'POST', body: { phone: '09171234567' } })).status, 403);
});
test('same checkout key replays without double deduction and rejects changed contents', async () => {
  const key = crypto.randomUUID();
  const first = await create(payload(), key); assert.equal(first.status, 201, JSON.stringify(first.data));
  const second = await create(payload(), key); assert.equal(second.status, 200);
  assert.equal(first.data.order._id, second.data.order._id); assert.equal(first.data.order.trackingToken, second.data.order.trackingToken);
  assert.equal(await Order.countDocuments(), 1); assert.equal((await Inventory.findOne()).currentStock, 9);
  assert.equal((await create(payload({ notes: 'changed' }), key)).status, 409);
});
test('concurrent purchases allocate unique numbers without overselling', async () => {
  const results = await Promise.all(Array.from({ length: 4 }, () => create()));
  assert.ok(results.every(r => r.status === 201), JSON.stringify(results));
  assert.equal(new Set(results.map(r => r.data.order.orderNumber)).size, 4);
  assert.equal((await Inventory.findOne()).currentStock, 6);
});
test('multi-product failure rolls back stock, order and movement ledger', async () => {
  const second = await MenuItem.create({ name: 'Tea', category: 'Tea', price: 100 });
  await Inventory.create({ name: 'Tea', productId: second._id, currentStock: 0 });
  const response = await create(payload({ items: [{ menuItemId: String(product._id), quantity: 1 }, { menuItemId: String(second._id), quantity: 1 }], totalAmount: 200 }));
  assert.equal(response.status, 400); assert.equal(await Order.countDocuments(), 0);
  assert.equal((await Inventory.findOne({ productId: product._id })).currentStock, 10);
  assert.equal(await StockMovement.countDocuments(), 0);
});
test('pending cancellation restores the same batch once; invalid resurrection rejected', async () => {
  const result = await create(); const id = result.data.order._id;
  const saved = await Order.findById(id); assert.equal(saved.stockDeductions[0].batches.length, 1);
  for (let i = 0; i < 2; i++) assert.equal((await request(`/api/orders/${id}/status`, { user: admin, method: 'PATCH', body: { status: 'cancelled' } })).status, 200);
  const stock = await Inventory.findOne(); assert.equal(stock.currentStock, 10); assert.equal(stock.batches[0].quantity, 10);
  assert.equal(await StockMovement.countDocuments({ kind: 'restore' }), 1);
  assert.equal((await request(`/api/orders/${id}`, { user: admin, method: 'PUT', body: { status: 'preparing' } })).status, 409);
});
test('prepared cancellation records waste without restoring food', async () => {
  const id = (await create()).data.order._id;
  for (const status of ['preparing', 'cancelled']) assert.equal((await request(`/api/orders/${id}/status`, { user: admin, method: 'PATCH', body: { status } })).status, 200);
  assert.equal((await Inventory.findOne()).currentStock, 9); assert.equal(await StockMovement.countDocuments({ kind: 'waste' }), 1);
});
test('kitchen cannot record payments or manage products', async () => {
  const id = (await create()).data.order._id;
  assert.equal((await request(`/api/orders/${id}/status`, { user: kitchen, method: 'PATCH', body: { paymentStatus: 'paid' } })).status, 403);
  assert.equal((await request('/api/admin/products', { user: kitchen })).status, 403);
});
test('partial payments expose the remaining balance and unbounded order reads are capped', async () => {
  const id = (await create()).data.order._id;
  assert.equal((await request(`/api/orders/${id}/status`, { user: admin, method: 'PATCH', body: { paymentStatus: 'partially_paid', amountPaid: 30 } })).status, 200);
  const summary = await request('/api/orders/summary', { user: admin }); assert.equal(summary.data.outstanding, 70);
  const list = await request('/api/orders?limit=0', { user: admin }); assert.equal(list.data.pagination.pageSize, 50); assert.equal(list.data.orders[0].paymentProof, undefined);
});
test('signed payment webhook retries are idempotent and failed order writes roll back payment', async t => {
  const id = (await create(payload({ paymentMethod: 'qrph' }))).data.order._id;
  await Payment.create({ providerCheckoutId: 'cs_fixture', orderId: id, method: 'qrph', amount: 100 });
  const event = amount => ({ data: { id: 'evt_fixture', attributes: { livemode: false, type: 'checkout_session.payment.paid', data: { id: 'cs_fixture', attributes: { payments: [{ id: 'pay_fixture', attributes: { amount, currency: 'PHP', status: 'paid' } }] } } } } });
  const send = async body => { const t = String(Math.floor(Date.now() / 1000)); const te = crypto.createHmac('sha256', process.env.PAYMONGO_WEBHOOK_SECRET).update(`${t}.${JSON.stringify(body)}`).digest('hex'); return request('/api/payments/paymongo/webhook', { method: 'POST', body, headers: { 'Paymongo-Signature': `t=${t},te=${te}` } }); };
  assert.equal((await send(event(5000))).status, 500); assert.equal((await Order.findById(id)).paymentStatus, 'payment_pending_verification');
  const save = Order.prototype.save;
  const failingSave = t.mock.method(Order.prototype, 'save', function (...args) { if (this.paymentStatus === 'paid') throw new Error('Simulated order write failure'); return save.apply(this, args); });
  assert.equal((await send(event(10000))).status, 500);
  assert.equal((await Payment.findOne({ providerCheckoutId: 'cs_fixture' })).status, 'pending');
  failingSave.mock.restore();
  for (let i = 0; i < 2; i++) assert.equal((await send(event(10000))).status, 200);
  const order = await Order.findById(id); assert.equal(order.paymentStatus, 'paid'); assert.equal(order.paymentTimeline.length, 1);
  assert.equal((await request('/api/payments/paymongo/webhook', { method: 'POST', body: event(10000) })).status, 401);
});
test('reviews require completed purchases and cannot impersonate another customer', async () => {
  const bad = await request('/api/reviews', { method: 'POST', user: customer, body: { orderId: new mongoose.Types.ObjectId(), menuItemId: product._id, rating: 5, userId: admin.id } });
  assert.equal(bad.status, 400); assert.equal(await require('../src/models/Review').countDocuments(), 0);
});
test('last unit can only be sold once under concurrent orders', async () => {
  const stock = await Inventory.findOne(); stock.currentStock = 1; stock.batches[0].quantity = 1; await stock.save();
  const results = await Promise.all([create(), create()]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 400]);
  assert.equal(await Order.countDocuments(), 1); assert.equal((await Inventory.findOne()).currentStock, 0);
});
test('store schedule edits retain effective history without exposing it publicly', async () => {
  const result = await request('/api/store', { user: admin, method: 'PUT', body: { closedDays: [0, 1] } });
  assert.equal(result.status, 200, JSON.stringify(result.data));
  const settings = await Settings.findOne().select('+scheduleHistory');
  assert.equal(settings.scheduleHistory.length, 1);
  assert.deepEqual([...settings.scheduleHistory[0].closedDays], [0, 1]);
  assert.equal((await request('/api/store')).data.scheduleHistory, undefined);
});
test('logout and role changes revoke previously issued tokens', async () => {
  assert.equal((await request('/api/auth/logout', { method: 'POST', user: customer })).status, 200);
  assert.equal((await request(`/api/users/${customer.id}`, { user: customer })).status, 401);
  await User.updateOne({ _id: admin.id }, { role: 'customer' });
  assert.equal((await request('/api/orders', { user: admin })).status, 401);
});
test('bulk stock adjustment rollback preserves all items and ledger', async () => {
  const stock = await Inventory.findOne();
  const response = await request('/api/admin/inventory/bulk/update-stock', { method: 'POST', user: admin, body: { updates: [{ id: stock._id, action: 'subtract', quantity: 2 }, { id: stock._id, action: 'subtract', quantity: 100 }] } });
  assert.equal(response.status, 400); assert.equal((await Inventory.findOne()).currentStock, 10); assert.equal(await StockMovement.countDocuments(), 0);
});
test('backup restores BSON types, document counts and indexes into an empty isolated database', async () => {
  const fs = require('node:fs'); const os = require('node:os');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'alimento-backup-'));
  const target = await mongoose.createConnection(repl.getUri(), { dbName: 'restore-verification' }).asPromise();
  try {
    const { backup, restore } = require('../scripts/backup');
    const manifest = await backup(mongoose.connection, directory);
    await restore(target, directory);
    for (const entry of manifest) assert.equal(await target.db.collection(entry.name).countDocuments(), entry.count);
    const restored = await target.db.collection('users').findOne({ email: 'admin@test.invalid' });
    assert.equal(restored._id.toHexString(), admin.id);
    assert.ok((await target.db.collection('orders').indexes()).some(i => i.name === 'idempotencyKey_1' && i.unique));
    await assert.rejects(restore(target, directory), /must be empty/);
  } finally {
    await target.close();
    const resolved = path.resolve(directory);
    if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep + 'alimento-backup-')) throw new Error('Unsafe temporary directory');
    fs.rmSync(resolved, { recursive: true });
  }
});

test('first purchase enforces history, cancellation and concurrent checkout', async () => {
 await Settings.updateOne({ key: 'store' }, { $set: { promotions: [{ name: 'Welcome', percent: 20, enabled: true, channel: 'portal', firstPurchaseOnly: true }] } });
 const items = [{ menuItemId: String(product._id), quantity: 1 }];
 const quote = user => request('/api/store/quote', { user, method: 'POST', body: { items, firstPurchaseEligible: true } });
 assert.equal((await quote()).data.discount, 0);
 assert.equal((await quote(admin)).data.discount, 0);
 assert.equal((await quote(customer)).data.discount, 20);
 const body = payload({ orderType: 'Delivery', totalAmount: 130, customerContact: '09171234567', paymentMethod: 'gcash', paymentProof: proof });
 const submit = () => request('/api/orders', { user: customer, method: 'POST', key: crypto.randomUUID(), body });
 const results = await Promise.all([submit(), submit()]);
 assert.equal(results.filter(r => r.status === 201).length, 1, JSON.stringify(results));
 assert.equal(await Order.countDocuments({ userId: customer.id }), 1);
 assert.equal((await quote(customer)).data.discount, 0);
 assert.equal((await submit()).status, 409);
 const id = results.find(r => r.status === 201).data.order._id;
 assert.equal((await request(`/api/orders/${id}/status`, { user: admin, method: 'PATCH', body: { status: 'cancelled' } })).status, 200);
 assert.equal((await quote(customer)).data.discount, 20);
 assert.equal((await submit()).status, 201);
});
