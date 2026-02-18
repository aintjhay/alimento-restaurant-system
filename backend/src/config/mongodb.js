/**
 * MongoDB Database Initialization
 * Establishes connection and ensures models are loaded
 */

const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Forecast = require('../models/Forecast');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alimento';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = mongoose.connection.readyState === 1;
    
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📍 Database: ${mongoose.connection.db.getName()}`);
    console.log(`🖥️  Host: ${mongoose.connection.host}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('✅ MongoDB Disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error.message);
  }
};

// Verify connection status
const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Get database stats
const getDBStats = async () => {
  if (!isDBConnected()) {
    return null;
  }

  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    const collections = {
      menuItems: await MenuItem.countDocuments(),
      orders: await Order.countDocuments(),
      forecasts: await Forecast.countDocuments()
    };

    return {
      ...stats,
      collections,
      connected: true
    };
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return null;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
  getDBStats,
  mongoose
};
