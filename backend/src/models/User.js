const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    enum: ['Home', 'Work', 'Other'],
    default: 'Home'
  },
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postal: {
    type: String,
    default: ''
  },
  phone: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  // Basic Info
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: String,
  
  // Authentication
  passwordHash: { type: String, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  sessionVersion: { type: Number, default: 0, select: false },
  role: {
    type: String,
    enum: ['customer', 'staff', 'cashier', 'kitchen', 'admin'],
    default: 'customer',
    index: true
  },
  
  // Profile
  profileImage: String,
  
  // Addresses
  addresses: [addressSchema],
  defaultAddressId: String,
  
  // Loyalty
  totalOrdersCount: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  loyaltyPoints: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'users' });

// Update updatedAt before saving
userSchema.pre('save', function(next) {
  const preferred = this.addresses.find(address => address.isDefault) || this.addresses[0];
  this.addresses.forEach(address => { address.isDefault = address === preferred; });
  this.defaultAddressId = preferred ? String(preferred._id) : null;
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
