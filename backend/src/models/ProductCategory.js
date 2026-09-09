const mongoose = require('mongoose');

const productCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '', trim: true },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, { timestamps: true });

productCategorySchema.index({ isActive: 1, displayOrder: 1, name: 1 });

module.exports = mongoose.model('ProductCategory', productCategorySchema);
