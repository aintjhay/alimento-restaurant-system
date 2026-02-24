const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');

// GET - Get reviews for a menu item
router.get('/item/:itemId', async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find({ menuItemId: req.params.itemId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalReviews = await Review.countDocuments({ menuItemId: req.params.itemId });
    
    // Calculate average rating
    const avgRating = await Review.aggregate([
      { $match: { menuItemId: require('mongoose').Types.ObjectId(req.params.itemId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    res.json({
      success: true,
      reviews,
      pagination: {
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit),
        currentPage: parseInt(page)
      },
      stats: {
        averageRating: avgRating[0]?.average || 0,
        totalReviews: totalReviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
});

// GET - Get all reviews by a user
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
});

// POST - Create new review
router.post('/', async (req, res) => {
  try {
    const { userId, userName, orderId, menuItemId, itemName, rating, title, comment, photos } = req.body;
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // Check if user already reviewed this item
    const existingReview = await Review.findOne({ 
      userId, 
      menuItemId 
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this item'
      });
    }
    
    const review = new Review({
      userId,
      userName,
      orderId,
      menuItemId,
      itemName,
      rating,
      title,
      comment,
      photos,
      verified: true
    });
    
    await review.save();
    
    // Update menu item with average rating
    const avgRatingData = await Review.aggregate([
      { $match: { menuItemId: require('mongoose').Types.ObjectId(menuItemId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    if (avgRatingData.length > 0) {
      await MenuItem.findByIdAndUpdate(menuItemId, {
        $set: {
          averageRating: avgRatingData[0].average,
          reviewCount: avgRatingData[0].count
        }
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
});

// PUT - Update review
router.put('/:reviewId', async (req, res) => {
  try {
    const { rating, title, comment, photos } = req.body;
    
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (photos) review.photos = photos;
    
    await review.save();
    
    // Update menu item rating
    const avgRatingData = await Review.aggregate([
      { $match: { menuItemId: review.menuItemId } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    if (avgRatingData.length > 0) {
      await MenuItem.findByIdAndUpdate(review.menuItemId, {
        $set: {
          averageRating: avgRatingData[0].average,
          reviewCount: avgRatingData[0].count
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Review updated successfully',
      review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
});

// DELETE - Delete review
router.delete('/:reviewId', async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    const menuItemId = review.menuItemId;
    
    await Review.findByIdAndDelete(req.params.reviewId);
    
    // Update menu item rating
    const avgRatingData = await Review.aggregate([
      { $match: { menuItemId: require('mongoose').Types.ObjectId(menuItemId) } },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    if (avgRatingData.length > 0) {
      await MenuItem.findByIdAndUpdate(menuItemId, {
        $set: {
          averageRating: avgRatingData[0].average,
          reviewCount: avgRatingData[0].count
        }
      });
    } else {
      await MenuItem.findByIdAndUpdate(menuItemId, {
        $set: {
          averageRating: 0,
          reviewCount: 0
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
});

// POST - Mark review as helpful
router.post('/:reviewId/helpful', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { $inc: { helpful: 1 } },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Review marked as helpful',
      helpful: review.helpful
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking review',
      error: error.message
    });
  }
});

module.exports = router;
