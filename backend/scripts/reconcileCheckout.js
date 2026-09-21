// Recover an uncertain checkout using its ID from the PayMongo dashboard. No new charge is created.
require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const Attempt = require('../src/models/CheckoutAttempt');
async function run() {
  const [orderId, checkoutId] = process.argv.slice(2);
  if (!mongoose.isValidObjectId(orderId) || !/^cs_[A-Za-z0-9]+$/.test(checkoutId || '')) throw new Error('Usage: node scripts/reconcileCheckout.js ORDER_ID CHECKOUT_ID');
  if (!process.env.PAYMONGO_SECRET_KEY) throw new Error('Configure PAYMONGO_SECRET_KEY');
  await mongoose.connect(process.env.MONGODB_URI);
  const response = await fetch(`https://api.paymongo.com/v1/checkout_sessions/${checkoutId}`, { headers: { Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64')}` }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Unable to retrieve provider checkout');
  const checkout = (await response.json()).data;
  await mongoose.connection.transaction(async session => {
    const order = await Order.findById(orderId).session(session);
    if (!order || checkout.attributes.reference_number !== order.orderNumber || order.paymentMethod !== 'qrph') throw new Error('Checkout does not belong to this order');
    const lines = checkout.attributes.line_items || [];
    if (!lines.length || lines.some(l => l.currency !== 'PHP') || lines.reduce((sum, l) => sum + l.amount * l.quantity, 0) !== Math.round(order.totalAmount * 100)) throw new Error('Checkout amount/currency mismatch');
    const existing = await Payment.findOne({ providerCheckoutId: checkoutId }).session(session);
    if (existing && String(existing.orderId) !== orderId) throw new Error('Checkout already linked to another order');
    if (!existing) await Payment.create([{ providerCheckoutId: checkoutId, orderId, method: 'qrph', amount: order.totalAmount, checkoutUrl: checkout.attributes.checkout_url }], { session });
    await Attempt.updateOne({ _id: orderId }, { state: 'ready', checkoutId, checkoutUrl: checkout.attributes.checkout_url }, { session, upsert: true });
  });
  if (checkout.attributes.payments?.some(p => p.attributes.status === 'paid')) await require('../src/services/paymentService').applyPaidEvent({ id: `reconcile_${checkoutId}`, attributes: { data: checkout } });
  console.log('Checkout reconciled. No new checkout or charge was created.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; }).finally(() => mongoose.disconnect());
