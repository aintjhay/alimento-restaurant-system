const mongoose = require('mongoose');

const promotion = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  enabled: { type: Boolean, default: false },
  firstPurchaseOnly: { type: Boolean, default: false },
  percent: { type: Number, required: true, min: 1, max: 100 },
  channel: { type: String, enum: ['portal', 'pos', 'both'], default: 'portal' },
  category: { type: String, default: '' },
  productId: { type: String, default: '' },
  startsAt: Date,
  endsAt: Date
});
const schema = new mongoose.Schema({
  key: { type: String, default: 'store', unique: true },
  title: { type: String, default: 'Your Alimento favorites, delivered.', maxlength: 160 },
  subtitle: { type: String, default: 'Browse the menu and pay with GCash.', maxlength: 300 },
  coverImage: { type: String, default: '' },
  gcashQr: { type: String, default: '' },
  announcement: { type: String, default: '', maxlength: 500 },
  closed: { type: Boolean, default: false },
  openingTime: { type: String, default: '11:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  closingTime: { type: String, default: '20:00', match: /^([01]\d|2[0-3]):[0-5]\d$/ },
  closedDays: { type: [{ type: Number, min: 0, max: 6 }], default: [0] },
  scheduleHistory: { type: [{ effectiveAt: Date, closed: Boolean, closedDays: [Number], openingTime: String, closingTime: String }], select: false, default: [] },
  promotions: { type: [promotion], default: [] }
}, { timestamps: true });
schema.statics.current = async function () { return await this.findOne({ key: 'store' }).lean() || new this().toObject(); };
module.exports = mongoose.model('StoreSettings', schema);
