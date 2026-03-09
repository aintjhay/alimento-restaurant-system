/**
 * Migration script to update menu items with missing images
 * Run this on your deployed server or locally to fix image paths in MongoDB
 * 
 * Usage: node migrateImages.js
 * Set MONGODB_URI environment variable to your MongoDB Atlas connection string
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MenuItem = require('./src/models/MenuItem');

// Image mappings for items that are missing images
const imageUpdates = [
  // Sandwiches
  { name: "BBQ CHEESEBURGER", image: "food/Choricheeseburger2.jpg" }, // Using variant image
  
  // Sides
  { name: "CAJUN FRIES", image: "food/placeholder.jpg" },
  
  // Rice Meals
  { name: "BURGER STEAK RICE MEAL", image: "food/Baconsteak.jpg" },
];

async function runMigration() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster>.mongodb.net/alimento?retryWrites=true&w=majority';
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Update each item
    for (const update of imageUpdates) {
      const result = await MenuItem.updateOne(
        { name: update.name },
        { image: update.image }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated: ${update.name} → ${update.image}`);
      } else if (result.matchedCount > 0) {
        console.log(`ℹ️  Found: ${update.name} (no changes needed)`);
      } else {
        console.log(`⚠️  Not found: ${update.name}`);
      }
    }

    console.log('\n✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

// Run migration
runMigration();
