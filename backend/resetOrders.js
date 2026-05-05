/**
 * Reset Orders Script
 * Wipes out all orders from the database to start fresh with order 00001
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');

const resetOrders = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alimento';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Get current order count
    const currentCount = await Order.countDocuments();
    console.log(`📊 Current orders in database: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log('✨ Database is already clean! No orders to delete.');
      await mongoose.disconnect();
      return;
    }
    
    // Delete all orders
    console.log('🗑️  Deleting all orders...');
    const result = await Order.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} orders`);
    
    // Verify deletion
    const newCount = await Order.countDocuments();
    console.log(`✨ Orders remaining: ${newCount}`);
    
    if (newCount === 0) {
      console.log('🎉 Success! Database reset. Next order will be ORD-00001');
    }
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error resetting orders:', error.message);
    process.exit(1);
  }
};

resetOrders();
