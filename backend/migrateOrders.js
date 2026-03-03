/**
 * Migration Script: Link old orders to registered users
 * 
 * This script finds all orders without a userId and matches them to
 * registered users based on customerEmail. This ensures that older
 * orders placed before user tracking was added get linked to the
 * correct customer accounts.
 * 
 * Usage:
 * node migrateOrders.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/alimento';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const migrateOrders = async () => {
    try {
        console.log('🔄 Starting order migration...\n');

        // Find all orders without userId
        const ordersWithoutUserId = await Order.find({ userId: { $exists: false } });
        
        console.log(`📋 Found ${ordersWithoutUserId.length} orders without user links\n`);

        if (ordersWithoutUserId.length === 0) {
            console.log('✅ All orders are already linked! Migration complete.');
            return {
                success: true,
                totalOrders: 0,
                linkedOrders: 0,
                skippedOrders: 0
            };
        }

        let linkedCount = 0;
        let skippedCount = 0;
        const linkedOrders = [];
        const skippedOrders = [];

        // Process each order
        console.log('Processing orders...\n');
        for (let i = 0; i < ordersWithoutUserId.length; i++) {
            const order = ordersWithoutUserId[i];
            
            // Skip if no customerEmail
            if (!order.customerEmail) {
                skippedOrders.push({
                    orderNumber: order.orderNumber,
                    reason: 'No customer email'
                });
                skippedCount++;
                continue;
            }

            // Find user with matching email
            const user = await User.findOne({ email: order.customerEmail.toLowerCase() });
            
            if (user) {
                // Link the order to the user
                order.userId = user._id;
                await order.save();
                linkedOrders.push({
                    orderNumber: order.orderNumber,
                    customerEmail: order.customerEmail,
                    userName: `${user.firstName} ${user.lastName}`
                });
                linkedCount++;
                console.log(`  ✅ (${i + 1}/${ordersWithoutUserId.length}) Linked Order #${order.orderNumber} → ${user.firstName} ${user.lastName}`);
            } else {
                skippedOrders.push({
                    orderNumber: order.orderNumber,
                    customerEmail: order.customerEmail,
                    reason: 'No matching registered user'
                });
                skippedCount++;
                console.log(`  ⏭️  (${i + 1}/${ordersWithoutUserId.length}) Skipped Order #${order.orderNumber} (${order.customerEmail}) - User not registered`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('MIGRATION REPORT');
        console.log('='.repeat(60));
        console.log(`Total orders processed:  ${ordersWithoutUserId.length}`);
        console.log(`Successfully linked:     ${linkedCount} ✅`);
        console.log(`Skipped (not matched):   ${skippedCount} ⏭️`);
        console.log('='.repeat(60));

        if (linkedCount > 0) {
            console.log('\n✅ Linked Orders:');
            linkedOrders.forEach(o => {
                console.log(`  • Order #${o.orderNumber}: ${o.customerEmail} → ${o.userName}`);
            });
        }

        if (skippedCount > 0) {
            console.log('\n⏭️  Skipped Orders:');
            skippedOrders.forEach(o => {
                console.log(`  • Order #${o.orderNumber}: ${o.reason}${o.customerEmail ? ` (${o.customerEmail})` : ''}`);
            });
        }

        console.log('\n✅ Migration complete!\n');

        return {
            success: true,
            totalOrders: ordersWithoutUserId.length,
            linkedOrders: linkedCount,
            skippedOrders: skippedCount
        };
    } catch (error) {
        console.error('❌ Migration error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const run = async () => {
    await connectDB();
    await migrateOrders();
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
};

run();
