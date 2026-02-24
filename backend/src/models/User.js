const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  id: {
    type: String,
    default: () => new ObjectId().toString()
  },
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
    required: true
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
  passwordHash: String,
  
  // Profile
  profileImage: String,
  preferences: {
    dietary: {
      vegetarian: { type: Boolean, default: false },
      vegan: { type: Boolean, default: false },
      glutenFree: { type: Boolean, default: false }
    },
    spicy: {
      type: String,
      enum: ['Not spicy', 'Mild', 'Medium', 'Hot', 'Very Hot'],
      default: 'Mild'
    },
    allergens: [String] // e.g., ['peanuts', 'shellfish']
  },
  
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
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
