const mongoose = require('mongoose');
module.exports = mongoose.model('StockMovement', new mongoose.Schema({
  inventoryId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, index: true },
  quantity: { type: Number, required: true },
  kind: { type: String, enum: ['sale', 'restore', 'waste', 'adjustment'], required: true },
  actor: { type: String, required: true }, reason: String,
  batches: [{ batchId: mongoose.Schema.Types.ObjectId, quantity: Number }]
}, { timestamps: true }));
