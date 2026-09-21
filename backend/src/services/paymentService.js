const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
function checkoutLines(order) {
  return [{ name: `Order ${order.orderNumber}`, description: 'Order total including discounts and delivery', amount: Math.round(order.totalAmount * 100), currency: 'PHP', quantity: 1 }];
}
async function applyPaidEvent(event) {
  const checkout = event.attributes.data;
  const paid = (checkout.attributes?.payments || []).filter(p => p.attributes?.status === 'paid');
  if (!paid.length || paid.some(p => p.attributes.currency !== 'PHP')) throw new Error('Invalid payment currency or status');
  return mongoose.connection.transaction(async session => {
    const payment = await Payment.findOne({ providerCheckoutId: checkout.id }).session(session);
    if (!payment) throw new Error('Checkout not persisted; retry event later');
    const received = paid.reduce((sum, p) => sum + p.attributes.amount, 0);
    if (received !== Math.round(payment.amount * 100)) throw new Error('Payment amount mismatch');
    const order = await Order.findById(payment.orderId).session(session);
    if (!order || Math.round(order.totalAmount * 100) !== received) throw new Error('Order amount mismatch');
    if (payment.status === 'paid') return;
    payment.status = 'paid'; payment.paidAt = new Date(); payment.lastEventId = event.id;
    payment.providerPaymentId = paid[0].id;
    order.amountPaid = payment.amount; order.paymentStatus = 'paid'; order.paymentVerifiedAt = payment.paidAt;
    order.paymentTimeline.push({ amount: payment.amount, kind: 'payment', by: 'paymongo', at: payment.paidAt, reference: event.id });
    await payment.save({ session }); await order.save({ session });
  });
}
module.exports = { checkoutLines, applyPaidEvent };
