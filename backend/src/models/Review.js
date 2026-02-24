const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Reviewer Info
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userImage: String,
  
  // What is being reviewed
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  
  // Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  comment: String,
  
  // Review Quality
  helpful: {
    type: Number,
    default: 0
  },
  notHelpful: {
    type: Number,
    default: 0
  },
  
  // Photos (optional)
  photos: [String], // URLs to uploaded images
  
  // Response from restaurant (optional)
  restaurantResponse: {
    comment: String,
    respondedAt: Date
  },
  
  // Status
  verified: {
    type: Boolean,
    default: true // Verified means they actually ordered the item
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
}, { collection: 'reviews' });

// Index for efficient queries
reviewSchema.index({ menuItemId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ orderId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
