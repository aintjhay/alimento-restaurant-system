const Order = require('../models/Order');

// Pending orders reserve eligibility; cancellation allows another attempt.
async function firstPurchaseEligible(user, session = null) {
  if (user?.role !== 'customer') return false;
  const previous = await Order.exists({ userId: user.userId, status: { $ne: 'cancelled' } }).session(session);
  return !previous;
}
module.exports = { firstPurchaseEligible };
