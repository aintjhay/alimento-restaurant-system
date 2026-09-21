const { test } = require('node:test');
const assert = require('node:assert/strict');
const { exportOrdersToCSV, exportOrdersToPDF, exportForecastToPDF, exportSummaryToCSV } = require('../utils/exportUtils');
const order = { orderNumber: 'ORD-1', customerName: '=FORMULA()', totalAmount: 100, amountPaid: 30, amountRefunded: 0, paymentStatus: 'partially_paid', status: 'preparing', createdAt: '2026-09-06T17:00:00Z', items: [] };
test('exports escape formula cells and retain actual partial payment amounts', () => {
  assert.ok(exportOrdersToCSV([order]).includes("'=FORMULA()"));
  const summary = exportSummaryToCSV([order], 'week');
  assert.ok(summary.includes('2026-09-07')); assert.ok(summary.includes('70.00'));
});
test('order and forecast PDF exports use the actual models without missing-field errors', () => {
  const forecast = { algorithm: 'Baseline', predictions: [{ ds: '2026-09-18', yhat: 2, yhat_lower: 0, yhat_upper: 4 }], performance: {} };
  for (const buffer of [exportOrdersToPDF([order]), exportForecastToPDF(forecast)]) assert.equal(Buffer.from(buffer).subarray(0, 4).toString(), '%PDF');
});
