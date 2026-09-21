const { Parser } = require('json2csv');
const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default;
const { summarizeSales } = require('../services/salesReportService');
const { dayKey } = require('../services/dashboardService');
const safe = value => typeof value === 'string' && /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
const money = value => Number(value || 0).toFixed(2);
function exportOrdersToCSV(orders) {
  return new Parser({ fields: ['Order', 'Customer', 'Type', 'Order value', 'Received', 'Refunded', 'Status', 'Payment status', 'Date (Asia/Manila)'] }).parse(orders.map(o => ({
    Order: safe(o.orderNumber), Customer: safe(o.customerName || 'Walk-in'), Type: o.orderType,
    'Order value': money(o.totalAmount), Received: money(o.amountPaid ?? (['paid', 'payment_verified', 'refunded'].includes(o.paymentStatus) ? o.totalAmount : 0)),
    Refunded: money(o.paymentStatus === 'refunded' ? o.totalAmount : o.amountRefunded), Status: o.status, 'Payment status': o.paymentStatus,
    'Date (Asia/Manila)': new Date(o.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })
  })));
}
function exportOrdersToPDF(orders) {
  const doc = new jsPDF(); doc.text('Orders report (Asia/Manila)', 14, 16);
  autoTable(doc, { startY: 24, head: [['Order', 'Customer', 'Order value (PHP)', 'Payment', 'Placed (PH)']], body: orders.map(o => [o.orderNumber, o.customerName || 'Walk-in', money(o.totalAmount), o.paymentStatus, dayKey(o.createdAt)]) });
  const { summary } = summarizeSales(orders);
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [['Metric', 'PHP']], body: [['Order value', money(summary.orderValue)], ['Collected', money(summary.collected)], ['Refunds', money(summary.refunds)], ['Outstanding', money(summary.unpaidTotal)]] });
  return doc.output('arraybuffer');
}
function exportForecastToPDF(forecast) {
  const doc = new jsPDF(); doc.text('Demand forecast', 14, 16);
  doc.setFontSize(10); doc.text(`Algorithm: ${forecast.algorithm || 'Unavailable'}`, 14, 24);
  const metric = n => n == null ? 'Not yet measured' : Number(n).toFixed(2);
  autoTable(doc, { startY: 30, head: [['Date', 'Expected orders', 'Lower', 'Upper', 'Actual']], body: (forecast.predictions || []).map(p => [p.ds, metric(p.yhat), metric(p.yhat_lower), metric(p.yhat_upper), p.actual == null ? 'Pending' : p.actual]) });
  autoTable(doc, { startY: doc.lastAutoTable.finalY + 10, head: [['Measured error', 'Value']], body: [['MAE', metric(forecast.performance?.mae)], ['MAPE (%) excluding zero actuals', metric(forecast.performance?.mape)], ['RMSE', metric(forecast.performance?.rmse)]] });
  return doc.output('arraybuffer');
}
function exportSummaryToCSV(orders, period = 'day') {
  if (!['day', 'week', 'month'].includes(period)) throw new Error('Invalid summary period');
  const groups = new Map();
  for (const order of orders) {
    let key = dayKey(order.createdAt);
    if (period === 'month') key = key.slice(0, 7);
    if (period === 'week') { const date = new Date(`${key}T12:00:00Z`); date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7); key = date.toISOString().slice(0, 10); }
    if (!groups.has(key)) groups.set(key, []); groups.get(key).push(order);
  }
  return new Parser({ fields: ['Period (PH)', 'Order value', 'Collected', 'Refunds', 'Outstanding', 'Unknown partial balances'] }).parse([...groups].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => {
    const { summary: s } = summarizeSales(values);
    return { 'Period (PH)': key, 'Order value': money(s.orderValue), Collected: money(s.collected), Refunds: money(s.refunds), Outstanding: money(s.unpaidTotal), 'Unknown partial balances': s.unknownPartialBalances };
  }));
}
module.exports = { exportOrdersToCSV, exportOrdersToPDF, exportForecastToPDF, exportSummaryToCSV };
