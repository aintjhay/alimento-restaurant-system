require('dotenv').config();
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const MenuItem = require('./src/models/MenuItem');

// PASTE THE ENTIRE COMPLETE MENU ARRAY HERE
// Copy the completeMenu array from my earlier message (the one with 70+ items)
// It should start with:
const completeMenu = [
  {
    name: "TEQUILA SUNRISE",
    description: "Vibrant tequila cocktail with orange juice and grenadine",
    price: 120,
    category: "Cocktails",
    image: "cocktails/tequila_sunrise.jpg",
    preparationTime: 8,
    tags: ["alcoholic", "popular"],
    displayOrder: 1
  },
  // ... and continue with all 70+ items
];

async function seed() {
    try {
        // Create in-memory MongoDB server
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        
        console.log('🔧 Starting in-memory MongoDB...');
        await mongoose.connect(uri);
        console.log('✅ Connected to in-memory MongoDB');
        
        // Clear existing menu items
        await MenuItem.deleteMany({});
        console.log('✅ Cleared existing menu items');
        
        // Insert complete menu
        await MenuItem.insertMany(completeMenu);
        console.log(`✅ Added ${completeMenu.length} menu items`);
        
        // Display statistics by category
        const categories = await MenuItem.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        console.log('\n📊 Menu Statistics by Category:');
        console.log('===============================');
        categories.forEach(cat => {
            console.log(`   ${cat._id}: ${cat.count} items`);
        });
        
        console.log('\n✅ Database seeded successfully!');
        
        // Keep the connection open
        console.log('\n💡 Press Ctrl+C to exit and start the server.');
        console.log('   Then run: npm run dev');
        
        // Don't exit - keep it running so data stays in memory
        process.on('SIGINT', async () => {
            await mongoose.disconnect();
            await mongod.stop();
            console.log('\n🛑 Database connection closed.');
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

// Check if menu array is defined
if (!completeMenu || completeMenu.length === 0) {
    console.error('❌ Error: completeMenu array is empty!');
    console.log('Please copy the 70+ item menu array into this file.');
    process.exit(1);
}

seed();