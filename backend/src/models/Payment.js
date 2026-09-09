const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  provider: { type: String, default: 'paymongo' },
  method: { type: String, enum: ['qrph'], required: true },
  providerCheckoutId: { type: String, unique: true, sparse: true },
  providerPaymentId: { type: String, unique: true, sparse: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'PHP' },
  status: { type: String, enum: ['pending', 'paid', 'failed', 'expired', 'refunded'], default: 'pending', index: true },
  checkoutUrl: String,
  paidAt: Date,
  lastEventId: String
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
