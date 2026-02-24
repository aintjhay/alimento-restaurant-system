const mongoose = require('mongoose');

const modifierOptionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 }
});

const modifierSchema = new mongoose.Schema({
  name: { type: String, required: true }, // "Size", "Flavor", "Temperature"
  required: { type: Boolean, default: false },
  options: [modifierOptionSchema]
});

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 }
});

const menuItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Cocktails', 
      'Pasta', 
      'Sandwiches', 
      'Sides', 
      'Rice Meals', 
      'Yogurt Milkshakes', 
      'Coffee', 
      'Coolers'
    ]
  },
  image: { 
    type: String, 
    default: '' 
  },
  modifiers: [modifierSchema],
  addons: [addonSchema],
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  preparationTime: { 
    type: Number, 
    default: 15 
  },
  ingredients: [{ 
    name: String, 
    quantity: String 
  }],
  tags: [{ 
    type: String 
  }], // e.g., ["spicy", "vegetarian", "best-seller"]
  displayOrder: {
    type: Number,
    default: 0
  },
  // Rating & Reviews
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
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

menuItemSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('MenuItem', menuItemSchema);