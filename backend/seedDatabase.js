/**
 * Database Seed Script
 * Seeds MongoDB with complete menu, sample orders, and forecast data
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/mongodb');
const MenuItem = require('./src/models/MenuItem');
const Order = require('./src/models/Order');
const Forecast = require('./src/models/Forecast');
const completeMenu = require('./src/data/completeMenu');

async function seed() {
  try {
    console.log('🌱 Starting Database Seed...\n');

    // Connect to database
    const connection = await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await MenuItem.deleteMany({});
    await Order.deleteMany({});
    await Forecast.deleteMany({});
    console.log('✅ Database cleared\n');

    // Seed Menu Items
    console.log('📋 Seeding menu items...');
    
    const menuItemsWithDefaults = completeMenu.map(item => ({
      ...item,
      modifiers: item.modifiers || [],
      addons: item.addons || [],
      isAvailable: true,
      preparationTime: item.preparationTime || 15
    }));

    const seedMenuItems = await MenuItem.insertMany(menuItemsWithDefaults);
    console.log(`✅ ${seedMenuItems.length} menu items added\n`);

    // Display statistics by category
    const categories = await MenuItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Menu Statistics by Category:');
    console.log('=' .repeat(40));
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} items`);
    });
    console.log();

    // Seed Sample Orders
    console.log('🛒 Seeding sample orders...');
    
    // Get random menu items for orders
    const getRandomMenuItems = () => {
      const count = Math.floor(Math.random() * 3) + 1;
      const items = [];
      for (let i = 0; i < count; i++) {
        const randomItem = seedMenuItems[Math.floor(Math.random() * seedMenuItems.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        items.push({
          menuItemId: randomItem._id,
          name: randomItem.name,
          price: randomItem.price,
          quantity,
          image: randomItem.image,
          modifiers: [],
          addons: [],
          itemTotal: randomItem.price * quantity
        });
      }
      return items;
    };

    const sampleOrders = [];
    const now = new Date();

    // Create 30 sample orders (distributed over last 30 days)
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(now);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      const items = getRandomMenuItems();
      const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
      const taxAmount = subtotal * 0.15; // 15% tax
      const totalAmount = subtotal + taxAmount;

      sampleOrders.push({
        orderNumber: `ORDER-${String(i + 1).padStart(6, '0')}`,
        tableNumber: String(Math.floor(Math.random() * 20) + 1),
        orderType: ['Dine-in', 'Takeaway', 'Delivery'][Math.floor(Math.random() * 3)],
        customerName: `Customer ${i + 1}`,
        customerContact: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        items,
        subtotal,
        taxAmount,
        totalAmount,
        status: ['completed', 'served', 'ready', 'preparing'][Math.floor(Math.random() * 4)],
        paymentStatus: 'paid',
        createdAt: orderDate,
        updatedAt: orderDate
      });
    }

    const seedOrders = await Order.insertMany(sampleOrders);
    console.log(`✅ ${seedOrders.length} sample orders added\n`);

    // Seed Forecast Data
    console.log('📊 Seeding forecast data...');
    
    const predictions = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate 60 days of forecast data (30 past, 30 future)
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;
      const baselineOrders = isWeekend ? 70 : 55;
      
      predictions.push({
        ds: dateStr,
        yhat: Math.max(30, Math.round(baselineOrders + (Math.random() - 0.5) * 20)),
        yhat_lower: Math.max(15, Math.round(baselineOrders - 20)),
        yhat_upper: Math.round(baselineOrders + 25),
        trend: (i / 30) * 5,
        weekly: Math.sin((dayOfWeek / 7) * Math.PI * 2) * 10,
        actual: i < 0 ? Math.round(baselineOrders + (Math.random() - 0.5) * 15) : null
      });
    }

    const forecastData = {
      generatedAt: new Date(),
      forecastDays: 30,
      historicalDays: 30,
      dataPoints: 30,
      algorithm: 'Prophet (Facebook)',
      modelVersion: '1.0',
      predictions,
      insights: [
        {
          type: 'high-demand',
          message: 'Expected high demand on weekends',
          recommendation: 'Ensure sufficient staff and ingredients'
        },
        {
          type: 'peak-day',
          message: 'Friday shows consistently high orders',
          recommendation: 'Plan inventory accordingly'
        },
        {
          type: 'normal-demand',
          message: 'Weekday demand is stable',
          recommendation: 'Maintain standard staffing levels'
        }
      ],
      status: 'completed'
    };

    const seedForecast = await Forecast.create(forecastData);
    console.log('✅ Forecast data added\n');

    // Summary
    console.log('='.repeat(50));
    console.log('✅ Database seed completed successfully!\n');
    console.log('📊 Seed Summary:');
    console.log(`   • Menu Items: ${seedMenuItems.length}`);
    console.log(`   • Sample Orders: ${seedOrders.length}`);
    console.log(`   • Forecast Predictions: ${predictions.length}`);
    console.log(`   • Database: ${connection.db.getName()}`);
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run seed if executed directly
if (require.main === module) {
  seed();
}

module.exports = seed;