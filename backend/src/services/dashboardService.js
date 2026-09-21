const Order = require('../models/Order');
const dayKey = date => new Date(new Date(date).getTime() + 8 * 3600000).toISOString().slice(0, 10);
const paidValue = { $ifNull: ['$amountPaid', { $cond: [{ $in: ['$paymentStatus', ['paid', 'payment_verified', 'refunded']] }, '$totalAmount', 0] }] };
const refundValue = { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, paidValue, { $ifNull: ['$amountRefunded', 0] }] };
async function dashboardSummary(period = 'today', now = new Date()) {
  if (!['today', 'week', 'month'].includes(period)) throw new Error('Invalid period');
  const today = new Date(`${dayKey(now)}T00:00:00+08:00`);
  const start = new Date(today.getTime() - (period === 'week' ? 6 : period === 'month' ? 29 : 0) * 86400000);
  const eligible = { status: { $ne: 'cancelled' }, paymentStatus: { $ne: 'refunded' } };
  const [result] = await Order.aggregate([{ $facet: {
    summary: [{ $match: { createdAt: { $gte: start, $lte: now } } }, { $group: { _id: null,
      orderValue: { $sum: { $cond: [{ $and: [{ $ne: ['$status', 'cancelled'] }, { $ne: ['$paymentStatus', 'refunded'] }] }, '$totalAmount', 0] } },
      orderCount: { $sum: { $cond: [{ $ne: ['$status', 'cancelled'] }, 1, 0] } },
      collected: { $sum: paidValue }, refunds: { $sum: refundValue }
    } }],
    active: [{ $match: { status: { $in: ['pending', 'preparing', 'ready', 'out_for_delivery', 'served'] } } }, { $count: 'count' }],
    delayed: [{ $match: { status: { $in: ['pending', 'preparing'] }, createdAt: { $lte: new Date(now.getTime() - 30 * 60000) } } }, { $count: 'count' }],
    outstanding: [{ $match: { ...eligible, $or: [{ paymentStatus: { $ne: 'partially_paid' } }, { amountPaid: { $exists: true } }] } }, { $group: { _id: null, amount: { $sum: { $max: [0, { $subtract: ['$totalAmount', paidValue] }] } } } }],
    unknownBalances: [{ $match: { status: { $ne: 'cancelled' }, paymentStatus: 'partially_paid', amountPaid: { $exists: false } } }, { $count: 'count' }],
    trend: [{ $match: { ...eligible, createdAt: { $gte: new Date(today.getTime() - 6 * 86400000), $lte: now } } }, { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: 'Asia/Manila' } }, total: { $sum: '$totalAmount' } } }, { $sort: { _id: 1 } }],
    topItems: [{ $match: { ...eligible, createdAt: { $gte: start, $lte: now } } }, { $unwind: '$items' }, { $group: { _id: '$items.name', quantity: { $sum: '$items.quantity' } } }, { $sort: { quantity: -1 } }, { $limit: 5 }]
  } }]);
  return { delayedCount: result.delayed[0]?.count || 0, summary: result.summary[0] || { orderValue: 0, orderCount: 0, collected: 0, refunds: 0 }, activeCount: result.active[0]?.count || 0, outstanding: result.outstanding[0]?.amount || 0, unknownPartialBalances: result.unknownBalances[0]?.count || 0, trend: result.trend.map(d => ({ date: d._id, total: d.total })), topItems: result.topItems.map(i => ({ name: i._id, quantity: i.quantity })) };
}
module.exports = { dashboardSummary, dayKey };
