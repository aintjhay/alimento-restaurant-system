const mongoose = require('mongoose');

const selectedModifierSchema = new mongoose.Schema({
  modifierName: { type: String, required: true },
  selectedOption: { type: String, required: true },
  extraPrice: { type: Number, default: 0 }
});

const selectedAddonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  image: {
    type: String,
    default: ''
  },
  modifiers: [selectedModifierSchema],
  addons: [selectedAddonSchema],
  specialInstructions: String,
  itemTotal: {
    type: Number,
    required: true,
    min: 0
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  orderType: {
    type: String,
    enum: ['Dine-in', 'Takeaway', 'Delivery'],
    default: 'Dine-in'
  },
  customerName: String,
  customerContact: String,
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'partially_paid', 'refunded'],
    default: 'unpaid'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'gcash', 'maya', 'bank_transfer', 'others'],
    default: 'cash'
  },
  notes: String,
  serverName: String,
  cookingTime: Number, // in minutes
  servedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const today = new Date();
    const dateStr = today.getFullYear().toString().slice(-2) + 
                   (today.getMonth() + 1).toString().padStart(2, '0') + 
                   today.getDate().toString().padStart(2, '0');
    
    const count = await this.constructor.countDocuments({
      orderNumber: new RegExp('^ORD-' + dateStr)
    });
    
    this.orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
  }
  
  // Calculate item totals and overall total
  if (this.isModified('items')) {
    this.items.forEach(item => {
      let itemTotal = item.price * item.quantity;
      
      // Add modifier prices
      item.modifiers.forEach(mod => {
        itemTotal += mod.extraPrice * item.quantity;
      });
      
      // Add addon prices
      item.addons.forEach(addon => {
        itemTotal += addon.price * item.quantity;
      });
      
      item.itemTotal = itemTotal;
    });
    
    // Recalculate subtotal
    this.subtotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Calculate tax (12%)
    this.taxAmount = this.subtotal * 0.12;
    
    // Calculate total
    this.totalAmount = this.subtotal + this.taxAmount - this.discount;
  }
  
  this.updatedAt = new Date();
  next();
});

// Indexes for faster queries
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ tableNumber: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.menuItemId': 1 });

module.exports = mongoose.model('Order', orderSchema);