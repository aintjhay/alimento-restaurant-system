const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

// Quick test with just a few items
const testMenu = [
  {
    name: "CHORIZO JALAPENO",
    description: "Spicy pasta with chorizo and jalapeño peppers",
    price: 200,
    category: "Pasta",
    image: "food/Chorizojalapeno.jpg",
    preparationTime: 15,
    tags: ["spicy", "popular"],
    displayOrder: 1
  },
  {
    name: "CLASSIC CARBONARA",
    description: "Creamy pasta with bacon, egg, and parmesan",
    price: 220,
    category: "Pasta",
    image: "food/Classiccarbonara.jpg",
    preparationTime: 15,
    tags: ["creamy", "classic"],
    displayOrder: 2
  },
  {
    name: "CHICKEN WINGS",
    description: "Crispy chicken wings with your choice of flavor",
    price: 260,
    category: "Sides",
    image: "food/BuffaloWings12(2).jpg",
    preparationTime: 20,
    tags: ["chicken", "popular"],
    displayOrder: 3,
    modifiers: [
      {
        name: "Size",
        required: true,
        options: [
          { name: "8pcs", price: 260 },
          { name: "12pcs", price: 350 }
        ]
      },
      {
        name: "Flavor",
        required: true,
        options: [
          { name: "Buffalo", price: 0 },
          { name: "BBQ", price: 0 },
          { name: "Parmesan", price: 0 }
        ]
      }
    ]
  }
];

async function quickSeed() {
  try {
    // Use your current MongoDB connection
    await mongoose.connect('mongodb://localhost:27017/alimento', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Clear and insert
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(testMenu);
    
    console.log(`✅ Added ${testMenu.length} test items`);
    
    // Verify
    const count = await MenuItem.countDocuments();
    console.log(`📊 Total items in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickSeed();