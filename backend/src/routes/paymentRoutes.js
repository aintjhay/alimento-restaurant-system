const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const router = express.Router();

router.post('/qrph/checkout', async (req, res) => {
  try {
    if (!process.env.PAYMONGO_SECRET_KEY) return res.status(503).json({ success: false, message: 'PayMongo is not configured' });
    const order = await Order.findById(req.body.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.status(409).json({ success: false, message: 'Order is already paid' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const payload = { data: { attributes: {
      billing: { name: order.customerName || 'Alimento Customer', phone: order.customerContact || undefined },
      cancel_url: `${frontendUrl}/portal/checkout?payment=cancelled`,
      success_url: `${frontendUrl}/portal/confirmation?payment=success&orderId=${order._id}`,
      description: `Alimento order ${order.orderNumber}`,
      reference_number: order.orderNumber,
      payment_method_types: ['qrph'],
      send_email_receipt: false,
      show_description: true,
      show_line_items: true,
      line_items: [...order.items.map(item => ({
        amount: Math.round(item.itemTotal / item.quantity * 100),
        currency: 'PHP',
        description: item.name,
        name: item.name,
        quantity: item.quantity
      })),
      ...(order.taxAmount > 0 ? [{ amount: Math.round(order.taxAmount * 100), currency: 'PHP', name: 'Tax', quantity: 1 }] : []),
      ...(order.deliveryFee > 0 ? [{ amount: Math.round(order.deliveryFee * 100), currency: 'PHP', name: 'Delivery fee', quantity: 1 }] : [])]
    } } };
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const responseBody = await response.json();
    if (!response.ok) throw new Error(responseBody.errors?.[0]?.detail || 'PayMongo checkout request failed');
    const checkout = responseBody.data;
    const payment = await Payment.findOneAndUpdate(
      { providerCheckoutId: checkout.id },
      { orderId: order._id, method: 'qrph', amount: order.totalAmount, status: 'pending', checkoutUrl: checkout.attributes.checkout_url },
      { new: true, upsert: true, runValidators: true }
    );
    order.paymentMethod = 'qrph';
    order.paymentStatus = 'payment_pending_verification';
    await order.save();
    res.status(201).json({ success: true, data: { paymentId: payment._id, checkoutUrl: payment.checkoutUrl } });
  } catch (error) {
    res.status(502).json({ success: false, message: error.message });
  }
});

router.post('/paymongo/webhook', async (req, res) => {
  try {
    const signatureHeader = req.get('Paymongo-Signature');
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    if (!signatureHeader || !webhookSecret || !req.rawBody) return res.status(401).json({ success: false });
    const parts = Object.fromEntries(signatureHeader.split(',').map(part => part.split('=')));
    const expected = crypto.createHmac('sha256', webhookSecret).update(`${parts.t}.${req.rawBody}`).digest('hex');
    const received = parts.li || parts.te;
    if (!received || received.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
      return res.status(401).json({ success: false });
    }
    const event = req.body.data;
    if (event?.attributes?.type === 'checkout_session.payment.paid') {
      const checkout = event.attributes.data;
      const payment = await Payment.findOne({ providerCheckoutId: checkout.id });
      if (payment && payment.lastEventId !== event.id) {
        payment.status = 'paid'; payment.paidAt = new Date(); payment.lastEventId = event.id;
        payment.providerPaymentId = checkout.attributes?.payments?.[0]?.id;
        await payment.save();
        await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'paid', paymentVerifiedAt: new Date() });
      }
    }
    res.json({ received: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid payment id' });
  const payment = await Payment.findById(req.params.id).select('orderId method amount currency status paidAt');
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
  res.json({ success: true, data: payment });
});

module.exports = router;
