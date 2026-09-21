const mongoose = require('mongoose');
const Order = require('../models/Order');
const StockMovement = require('../models/StockMovement');
const { restoreProductStock } = require('./inventoryService');
const fail = message => Object.assign(new Error(message), { status: 409 });
function validateTransition(order, next) {
  const transitions = { pending: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'], ready: [order.orderType === 'Delivery' ? 'out_for_delivery' : order.orderType === 'Takeaway' ? 'completed' : 'served', 'cancelled'], out_for_delivery: ['completed'], served: ['completed'], completed: [], cancelled: [] };
  if (next !== order.status && !(transitions[order.status] || []).includes(next)) throw fail(`Cannot change ${order.status} to ${next}. Refresh the order.`);
}
async function updateOrder(id, body, user) {
  return require('./transaction')(async session => {
    const order = await Order.findById(id).session(session);
    if (!order) throw Object.assign(new Error('Order not found'), { status: 404 });
    const actor = String(user.userId);
    const isKitchen = user.role === 'kitchen';
    if (isKitchen && body.status && !['preparing', 'ready'].includes(body.status) && !(body.itemIndex !== undefined && body.status === 'served')) throw Object.assign(new Error('Kitchen accounts can only update preparation and handoff.'), { status: 403 });
    if (isKitchen && (body.paymentStatus || body.amountPaid !== undefined || body.amountRefunded !== undefined || body.status === 'cancelled')) throw Object.assign(new Error('Kitchen staff may only update preparation.'), { status: 403 });
    const previous = order.status;
    if (body.itemIndex !== undefined) {
      const i = body.itemIndex;
      if (!Number.isInteger(i) || !order.items[i] || !['preparing', 'ready', 'served', 'completed'].includes(body.status)) throw fail('Invalid item update.');
      if (['cancelled', 'completed'].includes(order.status)) throw fail('This order is closed.');
      const item = order.items[i];
      const allowed = { pending: ['preparing'], preparing: ['ready'], ready: ['served', 'completed'], served: ['completed'], completed: [] };
      if (body.status !== item.itemStatus && !(allowed[item.itemStatus || 'pending'] || []).includes(body.status)) throw fail('Invalid item transition.');
      if (item.itemStatus !== body.status) {
        item.itemStatus = body.status;
        item.itemStatusTimeline.push({ status: body.status, timestamp: new Date(), changedBy: actor });
      }
      if (order.items.every(i => ['served', 'completed'].includes(i.itemStatus))) order.status = order.orderType === 'Delivery' ? 'out_for_delivery' : order.orderType === 'Takeaway' ? 'completed' : 'served';
      else if (order.items.every(i => ['ready', 'served', 'completed'].includes(i.itemStatus))) order.status = 'ready';
      else if (order.status === 'pending') order.status = 'preparing';
    } else if (body.status) {
      validateTransition(order, body.status);
      order.status = body.status;
      if (body.status !== 'cancelled' && previous !== body.status) {
        const itemStatus = body.status === 'out_for_delivery' ? 'served' : body.status;
        for (const item of order.items) {
          if (['served', 'completed'].includes(item.itemStatus) && ['preparing', 'ready'].includes(itemStatus)) continue;
          item.itemStatus = itemStatus;
          item.itemStatusTimeline.push({ status: itemStatus, timestamp: new Date(), changedBy: actor });
        }
      }
    }
    if (order.status !== previous) {
      order.statusTimeline.push({ status: order.status, timestamp: new Date(), changedBy: actor });
      if (order.status === 'completed') order.completedAt = new Date();
      if (order.status === 'cancelled' && !order.stockCancelledAt) {
        // Only untouched orders return to saleable stock; prepared food remains consumed.
        if (previous === 'pending') await restoreProductStock(order.stockDeductions, session);
        for (const entry of order.stockDeductions) await StockMovement.create([{ inventoryId: entry.inventoryId, orderId: order._id, quantity: previous === 'pending' ? entry.quantity : 0, kind: previous === 'pending' ? 'restore' : 'waste', actor, reason: `Cancelled from ${previous}; ${entry.quantity} units`, batches: entry.batches }], { session });
        order.stockCancelledAt = new Date();
      }
    }
    if (body.paymentStatus || body.amountPaid !== undefined || body.amountRefunded !== undefined) {
      if (order.paymentMethod === 'qrph') throw fail('Provider payments must be reconciled through the payment provider.');
      const statuses = ['unpaid', 'partially_paid', 'paid', 'payment_verified', 'refunded', 'payment_pending_verification'];
      if (body.paymentStatus && !statuses.includes(body.paymentStatus)) throw fail('Invalid payment status.');
      const oldPaid = order.amountPaid ?? (['paid', 'payment_verified', 'refunded'].includes(order.paymentStatus) ? order.totalAmount : 0);
      const paid = body.amountPaid !== undefined ? Number(body.amountPaid) : ['paid', 'payment_verified', 'refunded'].includes(body.paymentStatus) ? order.totalAmount : oldPaid;
      const refunded = body.amountRefunded !== undefined ? Number(body.amountRefunded) : body.paymentStatus === 'refunded' ? paid : order.amountRefunded || 0;
      if (![paid, refunded].every(Number.isFinite) || paid < oldPaid || paid > order.totalAmount || refunded < (order.amountRefunded || 0) || refunded > paid) throw fail('Invalid cumulative payment/refund amounts.');
      if (body.paymentStatus === 'partially_paid' && !(paid > 0 && paid < order.totalAmount)) throw fail('Enter the cumulative amount received for a partial payment.');
      for (const [kind, delta] of [['payment', paid - oldPaid], ['refund', refunded - (order.amountRefunded || 0)]]) if (delta) order.paymentTimeline.push({ kind, amount: delta, at: new Date(), by: actor });
      order.amountPaid = paid; order.amountRefunded = refunded;
      order.paymentStatus = refunded === paid && refunded > 0 ? 'refunded' : paid >= order.totalAmount ? 'payment_verified' : paid > 0 ? 'partially_paid' : 'unpaid';
      if (paid >= order.totalAmount) order.paymentVerifiedAt = new Date();
    }
    await order.save({ session });
    return order;
  });
}
module.exports = { updateOrder, validateTransition };
