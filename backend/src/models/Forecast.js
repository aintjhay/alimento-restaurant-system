/**
 * Forecast Model
 * Stores historical forecasts and predictions for tracking accuracy
 */

const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  ds: {
    type: String, // YYYY-MM-DD
    required: true
  },
  yhat: {
    type: Number, // Predicted value
    required: true
  },
  yhat_lower: {
    type: Number, // Lower confidence bound
    required: true
  },
  yhat_upper: {
    type: Number, // Upper confidence bound
    required: true
  },
  trend: {
    type: Number,
    default: 0
  },
  weekly: {
    type: Number,
    default: 0
  },
  actual: {
    type: Number, // Actual orders on that day (filled later)
    default: null
  },
  accuracy: {
    type: Number, // MAPE or similar metric
    default: null
  }
});

const insightSchema = new mongoose.Schema({
  _id: false,
  type: String, // 'high-demand', 'low-demand', 'normal-demand', 'peak-day', 'high-uncertainty'
  message: String,
  recommendation: String
});

const forecastSchema = new mongoose.Schema({
  generatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Configuration
  forecastDays: {
    type: Number,
    required: true,
    default: 7
  },
  
  historicalDays: {
    type: Number,
    required: true,
    default: 90
  },
  
  dataPoints: {
    type: Number, // Number of historical data points used
    required: true
  },
  
  // Predictions
  predictions: [predictionSchema],
  
  // Insights
  insights: [insightSchema],
  
  // Model metadata
  algorithm: {
    type: String,
    default: 'Prophet (Facebook)'
  },
  
  modelVersion: {
    type: String,
    default: '1.0'
  },
  
  // Seasonality info
  seasonalityEnabled: {
    yearly: { type: Boolean, default: false },
    weekly: { type: Boolean, default: true },
    daily: { type: Boolean, default: false }
  },
  
  // Tracking
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'validated'],
    default: 'completed'
  },
  
  // Performance metrics (after actual data comes in)
  performance: {
    mae: { type: Number, default: null }, // Mean Absolute Error
    mape: { type: Number, default: null }, // Mean Absolute Percentage Error
    rmse: { type: Number, default: null }, // Root Mean Square Error
    validatedAt: { type: Date, default: null }
  },
  
  // Additional notes
  notes: String
});

// Index for efficient querying
forecastSchema.index({ generatedAt: -1 });
forecastSchema.index({ status: 1 });

// Method to update accuracy when actual data arrives
forecastSchema.methods.recordActualData = function(date, actualOrders) {
  const prediction = this.predictions.find(p => p.ds === date);
  if (prediction) {
    prediction.actual = actualOrders;
    prediction.accuracy = Math.abs((actualOrders - prediction.yhat) / actualOrders) * 100;
  }
  return this.save();
};

// Method to calculate overall performance
forecastSchema.methods.calculatePerformance = function() {
  const completed = this.predictions.filter(p => p.actual !== null);
  
  if (completed.length === 0) {
    return null;
  }

  const mae = completed.reduce((sum, p) => sum + Math.abs(p.actual - p.yhat), 0) / completed.length;
  const mape = completed.reduce((sum, p) => sum + p.accuracy, 0) / completed.length;
  const rmse = Math.sqrt(completed.reduce((sum, p) => sum + Math.pow(p.actual - p.yhat, 2), 0) / completed.length);

  this.performance = {
    mae: parseFloat(mae.toFixed(2)),
    mape: parseFloat(mape.toFixed(2)),
    rmse: parseFloat(rmse.toFixed(2)),
    validatedAt: new Date()
  };

  return this.save();
};

// Static method to get latest forecast
forecastSchema.statics.getLatest = function() {
  return this.findOne().sort({ generatedAt: -1 });
};

// Static method to get forecasts for a date range
forecastSchema.statics.getForDateRange = function(startDate, endDate) {
  return this.find({
    generatedAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ generatedAt: -1 });
};

module.exports = mongoose.model('Forecast', forecastSchema);
