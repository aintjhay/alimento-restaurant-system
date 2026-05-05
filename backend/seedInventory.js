const mongoose = require('mongoose');
require('dotenv').config();
const Inventory = require('./src/models/Inventory');
const { connectDB } = require('./src/config/mongodb');

const inventoryData = [
  // ================ DAILY INVENTORY - CARBS ================
  { name: 'COOKED PASTA', category: 'Carbs', unit: 'PACK', currentStock: 3, minimumThreshold: 5, unitCost: 50, supplier: 'Local', location: 'Fridge', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: 'SLICED BREAD', category: 'Carbs', unit: 'PCS', currentStock: 2, minimumThreshold: 5, unitCost: 15, supplier: 'Local', location: 'Pantry', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: 'BUNS', category: 'Carbs', unit: 'PCS', currentStock: 4, minimumThreshold: 7, unitCost: 20, supplier: 'Local', location: 'Pantry', remarks: '<7', inventoryType: 'Daily', isActive: true },

  // ================ DAILY INVENTORY - MEAT ================
  { name: '110G CHORIZO', category: 'Meat', unit: 'PCS', currentStock: 2, minimumThreshold: 5, unitCost: 45, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: '100G CHORIZO', category: 'Meat', unit: 'PCS', currentStock: 3, minimumThreshold: 5, unitCost: 40, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: '80G CHORIZO', category: 'Meat', unit: 'PCS', currentStock: 4, minimumThreshold: 5, unitCost: 35, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: '50G CHORIZO', category: 'Meat', unit: 'PCS', currentStock: 6, minimumThreshold: 5, unitCost: 25, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: '100G BACON', category: 'Meat', unit: 'PCS', currentStock: 3, minimumThreshold: 5, unitCost: 50, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: '70G DICED BACON', category: 'Meat', unit: 'PCS', currentStock: 2, minimumThreshold: 5, unitCost: 35, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: '30G SLICED HOTDOG', category: 'Meat', unit: 'PCS', currentStock: 8, minimumThreshold: 5, unitCost: 15, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: 'SEAFOOD', category: 'Meat', unit: 'PCS', currentStock: 1, minimumThreshold: 3, unitCost: 120, supplier: 'Fish Market', location: 'Freezer', remarks: '<3', inventoryType: 'Daily', isActive: true },
  { name: '110G BEEF PATTY', category: 'Meat', unit: 'PCS', currentStock: 4, minimumThreshold: 5, unitCost: 60, supplier: 'Local Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: 'COATED WINGS 4S', category: 'Meat', unit: 'PCS', currentStock: 5, minimumThreshold: 7, unitCost: 80, supplier: 'Local Supplier', location: 'Freezer', remarks: '<7', inventoryType: 'Daily', isActive: true },
  { name: 'COATED CHICKEN THIGH', category: 'Meat', unit: 'PCS', currentStock: 2, minimumThreshold: 3, unitCost: 70, supplier: 'Local Supplier', location: 'Freezer', remarks: '<3', inventoryType: 'Daily', isActive: true },
  { name: 'CHICKEN TOCINO', category: 'Meat', unit: 'PCS', currentStock: 1, minimumThreshold: 3, unitCost: 55, supplier: 'Local Supplier', location: 'Freezer', remarks: '<3', inventoryType: 'Daily', isActive: true },

  // ================ DAILY INVENTORY - FRESH ================
  { name: 'TOMATO', category: 'Fresh', unit: 'KG', currentStock: 2, minimumThreshold: 3, unitCost: 80, supplier: 'Market', location: 'Fridge', remarks: '<3', inventoryType: 'Daily', isActive: true },
  { name: 'CUCUMBER', category: 'Fresh', unit: 'KG', currentStock: 1.5, minimumThreshold: 3, unitCost: 60, supplier: 'Market', location: 'Fridge', remarks: '<3', inventoryType: 'Daily', isActive: true },
  { name: 'GARLIC', category: 'Fresh', unit: 'KG', currentStock: 0.2, minimumThreshold: 0.3, unitCost: 150, supplier: 'Market', location: 'Pantry', remarks: '<300g', inventoryType: 'Daily', isActive: true },
  { name: 'LETTUCE', category: 'Fresh', unit: 'KG', currentStock: 0.05, minimumThreshold: 0.1, unitCost: 200, supplier: 'Market', location: 'Fridge', remarks: '<100g', inventoryType: 'Daily', isActive: true },
  { name: 'JALAPEÑO', category: 'Fresh', unit: 'KG', currentStock: 0.08, minimumThreshold: 0.1, unitCost: 180, supplier: 'Market', location: 'Fridge', remarks: '<100g', inventoryType: 'Daily', isActive: true },
  { name: 'LEMON', category: 'Fresh', unit: 'PCS', currentStock: 2, minimumThreshold: 3, unitCost: 10, supplier: 'Market', location: 'Pantry', remarks: '<3', inventoryType: 'Daily', isActive: true },

  // ================ DAILY INVENTORY - PREPPED SAUCES ================
  { name: 'GARLIC SAUCE 1600G/JAR', category: 'Prepped Sauces', unit: 'JAR', currentStock: 1, minimumThreshold: 2, unitCost: 200, supplier: 'In-house', location: 'Fridge', remarks: '', inventoryType: 'Daily', isActive: true },
  { name: 'BURGER SAUCE 1600G/JAR', category: 'Prepped Sauces', unit: 'JAR', currentStock: 1, minimumThreshold: 2, unitCost: 180, supplier: 'In-house', location: 'Fridge', remarks: '', inventoryType: 'Daily', isActive: true },
  { name: 'A BUFF SAUCE 1600G/JAR', category: 'Prepped Sauces', unit: 'JAR', currentStock: 1, minimumThreshold: 2, unitCost: 190, supplier: 'In-house', location: 'Fridge', remarks: '', inventoryType: 'Daily', isActive: true },
  { name: 'SPAG SAUCE 1600G/JAR', category: 'Prepped Sauces', unit: 'JAR', currentStock: 1, minimumThreshold: 2, unitCost: 170, supplier: 'In-house', location: 'Fridge', remarks: '', inventoryType: 'Daily', isActive: true },
  { name: 'GRAVY', category: 'Prepped Sauces', unit: 'PCS', currentStock: 3, minimumThreshold: 5, unitCost: 120, supplier: 'In-house', location: 'Fridge', remarks: '<5', inventoryType: 'Daily', isActive: true },
  { name: 'ATSUETE OIL 700ML/BOTTLE', category: 'Prepped Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 250, supplier: 'Local', location: 'Pantry', remarks: '', inventoryType: 'Daily', isActive: true },

  // ================ WEEKLY INVENTORY - OTHER FOOD ITEMS ================
  { name: 'LOAF BREAD', category: 'Other Food Items', unit: 'PCS', currentStock: 0, minimumThreshold: 1, unitCost: 100, supplier: 'Bakery', location: 'Pantry', remarks: '<1', inventoryType: 'Weekly', isActive: true },
  { name: 'RAW PASTA', category: 'Other Food Items', unit: 'PACK', currentStock: 2, minimumThreshold: 3, unitCost: 80, supplier: 'Supplier', location: 'Pantry', remarks: '<3', inventoryType: 'Weekly', isActive: true },
  { name: 'NACHOS', category: 'Other Food Items', unit: 'PACK', currentStock: 0, minimumThreshold: 1, unitCost: 150, supplier: 'Supplier', location: 'Pantry', remarks: '<1', inventoryType: 'Weekly', isActive: true },
  { name: 'SPANISH SARDINES', category: 'Other Food Items', unit: 'CAN', currentStock: 2, minimumThreshold: 3, unitCost: 45, supplier: 'Supplier', location: 'Pantry', remarks: '<3', inventoryType: 'Weekly', isActive: true },
  { name: 'HOTDOG 1KG/PACK', category: 'Other Food Items', unit: 'KG', currentStock: 3, minimumThreshold: 5, unitCost: 200, supplier: 'Supplier', location: 'Freezer', remarks: '<5', inventoryType: 'Weekly', isActive: true },
  { name: 'ALL PURPOSE FLOUR 1KG/PACK', category: 'Other Food Items', unit: 'PACK', currentStock: 2, minimumThreshold: 3, unitCost: 60, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'CORNSTARCH 1KG/PACK', category: 'Other Food Items', unit: 'PACK', currentStock: 1, minimumThreshold: 2, unitCost: 70, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: '1ST CLASS FLOUR 1KG/PACK', category: 'Other Food Items', unit: 'PACK', currentStock: 1, minimumThreshold: 2, unitCost: 80, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'FRENCH FRIES 25PCS/PACK', category: 'Other Food Items', unit: 'PCS', currentStock: 15, minimumThreshold: 20, unitCost: 30, supplier: 'Supplier', location: 'Freezer', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'RICE 25KG/SACK', category: 'Other Food Items', unit: 'KG', currentStock: 5, minimumThreshold: 6.25, unitCost: 40, supplier: 'Supplier', location: 'Pantry', remarks: '<1/4', inventoryType: 'Weekly', isActive: true },
  { name: 'PASTA 900G/PACK', category: 'Other Food Items', unit: 'PACK', currentStock: 2, minimumThreshold: 3, unitCost: 90, supplier: 'Supplier', location: 'Pantry', remarks: '<3', inventoryType: 'Weekly', isActive: true },
  { name: 'EGGS LARGE', category: 'Other Food Items', unit: 'PCS', currentStock: 10, minimumThreshold: 12, unitCost: 8, supplier: 'Farm', location: 'Fridge', remarks: '<12', inventoryType: 'Weekly', isActive: true },
  { name: 'BUTTER', category: 'Other Food Items', unit: 'PCS', currentStock: 1, minimumThreshold: 2, unitCost: 300, supplier: 'Supplier', location: 'Fridge', remarks: '<2', inventoryType: 'Weekly', isActive: true },
  { name: 'PALM OIL 20L/CONTAINER', category: 'Other Food Items', unit: 'L', currentStock: 15, minimumThreshold: 20, unitCost: 80, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'OLIVE OIL 5L/BOTTLE', category: 'Other Food Items', unit: 'BOTT', currentStock: 0.8, minimumThreshold: 1.25, unitCost: 500, supplier: 'Supplier', location: 'Pantry', remarks: '<1/4', inventoryType: 'Weekly', isActive: true },
  { name: 'PARMESAN CHEESE 1KG/PACK', category: 'Other Food Items', unit: 'KG', currentStock: 0.5, minimumThreshold: 1, unitCost: 600, supplier: 'Supplier', location: 'Fridge', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'LOCAL CHEESE', category: 'Other Food Items', unit: 'PCS', currentStock: 2, minimumThreshold: 3, unitCost: 200, supplier: 'Local', location: 'Fridge', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'SLICED CHEESE 22PCS/PACK', category: 'Other Food Items', unit: 'PACK', currentStock: 1, minimumThreshold: 2, unitCost: 150, supplier: 'Supplier', location: 'Fridge', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'OLIVES 920G/BOTTLE', category: 'Other Food Items', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 180, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'FRIED GARLIC 1KG/PACK', category: 'Other Food Items', unit: 'KG', currentStock: 0.5, minimumThreshold: 1, unitCost: 250, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },
  { name: 'PICKLES', category: 'Other Food Items', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 120, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Weekly', isActive: true },

  // ================ EVERY OTHER WEEK - RAW SAUCES ================
  { name: 'MAYONNAISE 1KG/PACK', category: 'Raw Sauces', unit: 'PACK', currentStock: 1, minimumThreshold: 2, unitCost: 180, supplier: 'Supplier', location: 'Fridge', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'KETCHUP 3KG/PACK', category: 'Raw Sauces', unit: 'PACK', currentStock: 1, minimumThreshold: 2, unitCost: 200, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'MUSTARD 200G/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 80, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'HOT SAUCE 3785ML/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 250, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'BUFFALO SAUCE 2.3KG/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 280, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'BBQ SAUCE 2.3KG/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 270, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'CANE VINEGAR 4L/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 120, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'SOY SAUCE 4L/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 150, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'OYSTER SAUCE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 140, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'LIQUID SMOKE 1L/BOTTLE', category: 'Raw Sauces', unit: 'BOTT', currentStock: 1, minimumThreshold: 2, unitCost: 200, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },

  // ================ EVERY OTHER WEEK - HERBS AND SEASONINGS ================
  { name: 'SALT', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 2, minimumThreshold: 3, unitCost: 30, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'MSG', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 1, minimumThreshold: 2, unitCost: 150, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'WHITE SUGAR', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 2, minimumThreshold: 3, unitCost: 50, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'BROWN SUGAR', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 1, minimumThreshold: 2, unitCost: 60, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'BLACK PEPPER CORN', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.5, minimumThreshold: 1, unitCost: 400, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'WHITE PEPPER POWDER', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.3, minimumThreshold: 0.5, unitCost: 350, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'ONION POWDER', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.5, minimumThreshold: 1, unitCost: 200, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'GARLIC POWDER', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.5, minimumThreshold: 1, unitCost: 220, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'CAJUN POWDER', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.3, minimumThreshold: 0.5, unitCost: 300, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'PARSLEY', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.2, minimumThreshold: 0.5, unitCost: 250, supplier: 'Supplier', location: 'Fridge', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'PAPRIKA', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.3, minimumThreshold: 0.5, unitCost: 280, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'OREGANO', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.2, minimumThreshold: 0.5, unitCost: 260, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'THYME', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.2, minimumThreshold: 0.5, unitCost: 270, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'BASIL', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.2, minimumThreshold: 0.5, unitCost: 280, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true },
  { name: 'ROSEMARY', category: 'Herbs and Seasonings', unit: 'KG', currentStock: 0.2, minimumThreshold: 0.5, unitCost: 290, supplier: 'Supplier', location: 'Pantry', remarks: '', inventoryType: 'Every Other Week', isActive: true }
];

async function seedInventory() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing inventory
    await Inventory.deleteMany({});
    console.log('Cleared existing inventory');

    // Insert new inventory items
    const inserted = await Inventory.insertMany(inventoryData);
    console.log(`✅ Seeded ${inserted.length} inventory items`);

    // Show summary
    const summary = await Inventory.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$currentStock', '$unitCost'] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Inventory Summary by Category:');
    summary.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} items (₱${cat.totalValue.toFixed(2)})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
    process.exit(1);
  }
}

seedInventory();
