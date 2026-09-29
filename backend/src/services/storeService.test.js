const test = require('node:test');
const assert = require('node:assert/strict');
const { isOpen, priceItems, validImage } = require('./storeService');
const product = { _id: 'a', name: 'Cocktail', price: 200, category: 'Cocktails', modifiers: [], addons: [{ name: 'Extra', price: 20 }] };
const now = new Date('2026-09-14T04:00:00Z');
const settings = { openingTime: '10:00', closingTime: '20:00', promotions: [
  { name: 'Launch', enabled: true, percent: 20, channel: 'portal' },
  { name: 'Cocktail special', enabled: true, percent: 50, channel: 'both', category: 'Cocktails' }
] };
test('closing is exactly 8 PM in Manila, with manual closure overriding hours', () => {
  assert.equal(isOpen(settings, new Date('2026-09-14T11:59:00Z')), true);
  assert.equal(isOpen(settings, new Date('2026-09-14T12:00:00Z')), false);
  assert.equal(isOpen(settings, new Date('2026-09-14T01:59:00Z')), false);
  assert.equal(isOpen({ ...settings, closed: true }, now), false);
});

test('removing Sunday from closed days opens Sunday within hours, while other closure rules still apply', () => {
  const sunday = new Date('2026-09-13T04:00:00Z');
  assert.equal(isOpen({ ...settings, closedDays: [0] }, sunday), false);
  assert.equal(isOpen({ ...settings, closedDays: [] }, sunday), true);
  assert.equal(isOpen({ ...settings, closedDays: [], closed: true }, sunday), false);
  assert.equal(isOpen({ ...settings, closedDays: [] }, new Date('2026-09-13T12:00:00Z')), false);
});
test('server prices override forged prices and apply largest discount once, excluding delivery fee', () => {
  const quote = priceItems([{ menuItemId: 'a', quantity: 2, price: 1, addons: [{ name: 'Extra', price: 0 }] }], [product], settings, 'portal', now);
  assert.equal(quote.subtotal, 440); assert.equal(quote.discount, 220); assert.equal(quote.totalAmount, 270);
  assert.equal(quote.items[0].promotionName, 'Cocktail special');
});
test('channel, product and schedule restrictions are honored', () => {
  const s = { ...settings, promotions: [{ ...settings.promotions[0], productId: 'a', startsAt: '2026-09-14T04:00:00Z', endsAt: '2026-09-14T05:00:00Z' }] };
  const items = [{ menuItemId: 'a', quantity: 1 }];
  assert.equal(priceItems(items, [product], s, 'portal', now).discount, 40);
  assert.equal(priceItems(items, [product], s, 'pos', now).discount, 0);
  assert.equal(priceItems(items, [product], s, 'portal', new Date('2026-09-14T05:00:00Z')).discount, 0);
});
test('reject invalid quantities, unavailable products and forged options', () => {
  for (const quantity of [0, -1, 1.5, 101]) assert.throws(() => priceItems([{ menuItemId: 'a', quantity }], [product], settings, 'portal'));
  assert.throws(() => priceItems([{ menuItemId: 'a', quantity: 1, addons: [{ name: 'Fake' }] }], [product], settings, 'portal'));
  assert.throws(() => priceItems([{ menuItemId: 'a', quantity: 1 }], [{ ...product, isAvailable: false }], settings, 'portal'));
});
test('receipt uploads must contain supported image data', () => {
  assert.equal(validImage('data:image/png;base64,' + Buffer.from('not an image').toString('base64')), false);
  assert.equal(validImage('https://example.com/proof.png'), false);
  assert.equal(validImage('data:image/svg+xml;base64,PHN2Zz4='), false);
  assert.equal(validImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='), true);
});

test('first purchase requires eligibility and excludes POS', () => {
 const s = { promotions: [{ name: 'Welcome', enabled: true, percent: 40, channel: 'both', firstPurchaseOnly: true }, { name: 'Regular', enabled: true, percent: 10, channel: 'both' }] };
 const items = [{ menuItemId: 'a', quantity: 1 }];
 assert.equal(priceItems(items, [product], s, 'portal', now, true).discount, 80);
 assert.equal(priceItems(items, [product], s, 'portal', now).discount, 20);
 assert.equal(priceItems(items, [product], s, 'pos', now, true).discount, 20);
});
