const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Carbs', 'Meat', 'Fresh', 'Prepped Sauces', 'Other Food Items', 'Raw Sauces', 'Herbs and Seasonings'],
    default: 'Other Food Items'
  },
  unit: {
    type: String,
    required: true,
    enum: ['PCS', 'KG', 'PACK', 'JAR', 'BOTT', 'L', 'CAN', 'SACK'],
    default: 'PCS'
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minimumThreshold: {
    type: Number,
    required: true,
    default: 5,
    min: 0
  },
  maximumCapacity: {
    type: Number,
    default: null
  },
  reorderQuantity: {
    type: Number,
    default: null
  },
  unitCost: {
    type: Number,
    default: 0,
    min: 0
  },
  supplier: String,
  location: String, // Storage location in kitchen
  expiryDate: Date,
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  remarks: String,
  isActive: {
    type: Boolean,
    default: true
  },
  inventoryType: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Every Other Week'],
    default: 'Daily'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
inventoryItemSchema.index({ category: 1, isActive: 1 });
inventoryItemSchema.index({ currentStock: 1 });
inventoryItemSchema.index({ minimumThreshold: 1 });

// Pre-save hook to update timestamp
inventoryItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Inventory', inventoryItemSchema);
