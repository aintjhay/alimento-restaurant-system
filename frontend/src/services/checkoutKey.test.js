import { checkoutKey, finishCheckout } from './checkoutKey';
beforeEach(() => sessionStorage.clear());
test('retries retain their key; changed contents and completed orders start a new attempt', () => {
  const order = { items: [{ id: 'coffee', quantity: 1 }], totalAmount: 100 };
  const first = checkoutKey('pos', order);
  expect(first).toMatch(/^[a-f0-9]{32}$/);
  expect(checkoutKey('pos', { ...order })).toBe(first);
  expect(checkoutKey('pos', { ...order, totalAmount: 200 })).not.toBe(first);
  const second = checkoutKey('pos', order);
  finishCheckout('pos');
  expect(checkoutKey('pos', order)).not.toBe(second);
});
