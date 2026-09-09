const test = require('node:test');
const assert = require('node:assert/strict');
const { salesRange, summarizeSales } = require('./salesReportService');
const order = (paymentStatus, totalAmount, quantity = 1) => ({ paymentStatus, totalAmount, createdAt: '2026-09-06T17:00:00Z', items: [{ name: 'Coffee', menuItemId: 'coffee', quantity }] });
test('paid averages and item counts exclude unpaid, partial and refunded orders', () => {
  const result = summarizeSales([order('paid', 179.2, 2), order('unpaid', 733.2), order('unpaid', 448), order('partially_paid', 200), order('refunded', 100)]);
  assert.equal(result.summary.averageOrderValue, 179.2);
  assert.equal(result.summary.unpaidTotal, 1181.2);
  assert.equal(result.summary.paidOrderCount, 1);
  assert.equal(result.summary.itemsSold, 2);
  assert.equal(result.summary.orderCount, 5);
  assert.equal(result.trend[0].date, '2026-09-07');
});
test('verified payments count as sales; empty reports have zero average', () => {
  assert.equal(summarizeSales([order('payment_verified', 50)]).summary.totalSales, 50);
  assert.equal(summarizeSales([]).summary.averageOrderValue, 0);
});
test('calendar week begins Monday in Manila even on UTC Sunday', () => {
  const range = salesRange({ view: 'weekly' }, new Date('2026-09-06T17:00:00Z'));
  assert.equal(range.start.toISOString(), '2026-09-06T16:00:00.000Z');
});
test('custom end date includes the entire Philippine day', () => {
  const range = salesRange({ view: 'custom', startDate: '2026-09-07', endDate: '2026-09-07' });
  assert.equal(range.start.toISOString(), '2026-09-06T16:00:00.000Z');
  assert.equal(range.end.toISOString(), '2026-09-07T15:59:59.999Z');
});
test('invalid and reversed date ranges are rejected', () => {
  for (const [startDate, endDate] of [['2026-02-30', '2026-03-01'], ['', '2026-09-07'], ['2026-09-08', '2026-09-07']]) assert.throws(() => salesRange({ view: 'custom', startDate, endDate }));
});
