const test = require('node:test');
const assert = require('node:assert/strict');
const { expirationAlerts, changeStock, validExpiryDate } = require('./stockBatches');

test('expiration uses Manila calendar days and includes the seventh day', () => {
  const item = { batches: ['2026-09-09', '2026-09-10', '2026-09-17', '2026-09-18'].map(expiryDate => ({ quantity: 2, expiryDate })) };
  assert.deepEqual(expirationAlerts(item, new Date('2026-09-09T16:00:00Z')).map(batch => batch.status), ['expired', 'expiring-soon', 'expiring-soon']);
});

test('legacy opening stock alerts disappear when stock is removed', () => {
  const item = { currentStock: 3, expiryDate: '2026-09-01' };
  const now = new Date('2026-09-10T00:00:00Z');
  assert.equal(expirationAlerts(item, now).length, 1);
  changeStock(item, { action: 'subtract', quantity: 3 });
  assert.equal(item.currentStock, 0);
  assert.deepEqual(expirationAlerts(item, now), []);
});

test('restocks retain separate expiry dates and removal targets the selected batch', () => {
  const item = { currentStock: 2, batches: [{ _id: 'old', quantity: 2, expiryDate: '2026-09-01' }] };
  changeStock(item, { action: 'add', quantity: 5, expiryDate: '2026-10-01' });
  changeStock(item, { action: 'subtract', quantity: 2, batchId: 'old' });
  assert.equal(item.currentStock, 5);
  assert.equal(item.batches[1].expiryDate, '2026-10-01');
  assert.deepEqual(expirationAlerts(item, new Date('2026-09-10T00:00:00Z')), []);
});

test('expiry validation permits blank dates and rejects invalid values', () => {
  for (const value of ['', null, undefined, '2028-02-29']) assert.equal(validExpiryDate(value), true);
  for (const value of [false, 0, '2026-02-29', '09/10/2026', 'invalid']) assert.equal(validExpiryDate(value), false);
});
