const mongoose = require('mongoose');
module.exports = mongoose.model('CheckoutAttempt', new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  state: { type: String, enum: ['creating', 'ready', 'uncertain'], default: 'creating' },
  checkoutId: String, checkoutUrl: String
}, { timestamps: true }));
