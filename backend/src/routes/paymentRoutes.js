const router = require('express').Router();
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Attempt = require('../models/CheckoutAttempt');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { checkoutLines, applyPaidEvent } = require('../services/paymentService');
router.post('/qrph/checkout', authMiddleware, requireRole('admin', 'staff', 'cashier'), async (req, res) => {
  let ownsAttempt = false;
  try {
    if (!process.env.PAYMONGO_SECRET_KEY) return res.status(503).json({ message: 'PayMongo is not configured' });
    const order = await Order.findById(req.body.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentMethod !== 'qrph' || ['cancelled', 'completed'].includes(order.status) || ['paid', 'payment_verified', 'refunded'].includes(order.paymentStatus)) return res.status(409).json({ message: 'Order is not eligible for checkout' });
    const existing = await Attempt.findById(order._id);
    if (existing) {
      if (existing.checkoutUrl) return res.json({ success: true, data: { checkoutUrl: existing.checkoutUrl } });
      return res.status(409).json({ message: 'Payment session is being reconciled. Do not create a second payment.' });
    }
    await Attempt.create({ _id: order._id }); ownsAttempt = true;
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    let checkout;
    try {
      const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', { method: 'POST', signal: controller.signal,
        headers: { Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64')}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { attributes: { reference_number: order.orderNumber, payment_method_types: ['qrph'], line_items: checkoutLines(order), description: `Alimento ${order.orderNumber}`, show_line_items: true, show_description: true, send_email_receipt: false, cancel_url: `${frontend}/admin/pos`, success_url: `${frontend}/admin/dashboard` } } }) });
      const result = await response.json();
      if (!response.ok) throw new Error('Provider rejected checkout');
      checkout = result.data;
    } finally { clearTimeout(timeout); }
    await mongoose.connection.transaction(async session => {
      await Payment.create([{ providerCheckoutId: checkout.id, orderId: order._id, method: 'qrph', amount: order.totalAmount, status: 'pending', checkoutUrl: checkout.attributes.checkout_url }], { session });
      await Attempt.updateOne({ _id: order._id }, { state: 'ready', checkoutId: checkout.id, checkoutUrl: checkout.attributes.checkout_url }, { session });
    });
    res.status(201).json({ success: true, data: { checkoutUrl: checkout.attributes.checkout_url } });
  } catch (error) {
    if (ownsAttempt) await Attempt.updateOne({ _id: req.body.orderId, state: 'creating' }, { state: 'uncertain' }).catch(() => {});
    res.status(error.code === 11000 ? 409 : 502).json({ message: error.code === 11000 ? 'Checkout already in progress' : 'Unable to create payment session. Reconcile the attempt before retrying.' });
  }
});
router.post('/paymongo/webhook', async (req, res) => {
  try {
    const parts = Object.fromEntries((req.get('Paymongo-Signature') || '').split(',').map(p => p.trim().split('=')));
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
    const live = process.env.PAYMONGO_SECRET_KEY?.startsWith('sk_live_');
    const received = parts[live ? 'li' : 'te'];
    if (!secret || !req.rawBody || !/^\d+$/.test(parts.t || '') || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300 || !/^[a-f0-9]{64}$/i.test(received || '')) return res.sendStatus(401);
    const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${req.rawBody}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) return res.sendStatus(401);
    const event = req.body.data;
    if (event?.attributes?.livemode !== Boolean(live)) return res.sendStatus(401);
    if (event?.attributes?.type === 'checkout_session.payment.paid') await applyPaidEvent(event);
    res.json({ received: true });
  } catch { res.status(500).json({ message: 'Payment event was not committed; retry required.' }); }
});
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).select('orderId method amount currency status paidAt');
    if (!payment) return res.sendStatus(404);
    const order = await Order.findById(payment.orderId).select('userId');
    if (!['admin', 'staff', 'cashier'].includes(req.user.role) && String(order?.userId) !== String(req.user.userId)) return res.sendStatus(403);
    res.set('Cache-Control', 'no-store').json({ success: true, data: payment });
  } catch { res.status(400).json({ message: 'Invalid payment' }); }
});
module.exports = router;
