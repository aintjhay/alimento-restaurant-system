const DAY = 86400000;
const dateKey = date => new Date(new Date(date).getTime() + 8 * 3600000).toISOString().slice(0, 10);
const paid = order => ['paid', 'payment_verified'].includes(order.paymentStatus);

function salesRange(query, now = new Date()) {
  const today = new Date(`${dateKey(now)}T00:00:00+08:00`);
  let start = null;
  let end = new Date(now);
  if (query.view === 'today') start = today;
  else if (query.view === 'weekly') {
    const weekday = new Date(today.getTime() + 8 * 3600000).getUTCDay();
    start = new Date(today.getTime() - ((weekday + 6) % 7) * DAY);
  } else if (query.view === 'monthly') start = new Date(`${dateKey(now).slice(0, 7)}-01T00:00:00+08:00`);
  else if (query.view === 'custom') {
    for (const value of [query.startDate, query.endDate]) {
      if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(`${value}T00:00:00+08:00`)) || dateKey(`${value}T00:00:00+08:00`) !== value) throw new Error('Choose valid start and end dates.');
    }
    start = new Date(`${query.startDate}T00:00:00+08:00`);
    end = new Date(new Date(`${query.endDate}T00:00:00+08:00`).getTime() + DAY - 1);
    if (start > end) throw new Error('Start date must be on or before end date.');
  } else if (query.view && !['history', 'all'].includes(query.view)) throw new Error('Invalid report period.');
  return { start, end };
}

function summarizeSales(orders) {
  const summary = { collected: 0, refunds: 0, orderValue: 0, unknownPartialBalances: 0, totalSales: 0, paidOrderCount: 0, orderCount: orders.length, unpaidTotal: 0, itemsSold: 0, averageOrderValue: 0 };
  const products = new Map();
  const days = new Map();
  for (const order of orders) {
    const received = order.amountPaid ?? (['paid', 'payment_verified', 'refunded'].includes(order.paymentStatus) ? order.totalAmount : 0);
    const refunded = order.paymentStatus === 'refunded' ? received : order.amountRefunded || 0;
    summary.collected += received; summary.refunds += refunded;
    if (order.status !== 'cancelled' && order.paymentStatus !== 'refunded') summary.orderValue += order.totalAmount;
    if (order.status !== 'cancelled' && ['unpaid', 'payment_pending_verification', 'partially_paid'].includes(order.paymentStatus)) {
      if (order.paymentStatus === 'partially_paid' && order.amountPaid === undefined) summary.unknownPartialBalances++;
      else summary.unpaidTotal += Math.max(0, order.totalAmount - received);
    }
    if (order.status === 'cancelled') continue;
    if (!paid(order)) continue;
    summary.totalSales += order.totalAmount;
    summary.paidOrderCount++;
    const day = dateKey(order.createdAt);
    days.set(day, (days.get(day) || 0) + order.totalAmount);
    for (const item of order.items || []) {
      if (item.itemStatus === 'cancelled') continue;
      summary.itemsSold += item.quantity;
      const key = String(item.menuItemId || item.name);
      const product = products.get(key) || { id: key, name: item.name, quantity: 0 };
      product.quantity += item.quantity;
      products.set(key, product);
    }
  }
  summary.averageOrderValue = summary.paidOrderCount ? summary.totalSales / summary.paidOrderCount : 0;
  return { summary, topItems: [...products.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5), trend: [...days].sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({ date, total })) };
}

module.exports = { salesRange, summarizeSales };
