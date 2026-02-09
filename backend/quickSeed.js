const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

// Complete menu with all 49 items
const completeMenu = [
  // COCKTAILS
  { name: "TEQUILA SUNRISE", description: "Vibrant tequila cocktail with orange juice and grenadine", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "popular"], displayOrder: 1 },
  { name: "PIÑA COLADA", description: "Creamy coconut rum cocktail with pineapple juice", price: 130, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "tropical"], displayOrder: 2 },
  { name: "MOJITO", description: "Refreshing mint rum cocktail with lime and soda", price: 115, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "refreshing"], displayOrder: 3 },
  { name: "MARGARITA", description: "Classic tequila cocktail with lime and salt rim", price: 125, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "popular"], displayOrder: 4 },
  { name: "LONG ISLAND ICED TEA", description: "Strong mixed cocktail with multiple spirits", price: 150, category: "Cocktails", image: "", preparationTime: 10, tags: ["alcoholic", "strong"], displayOrder: 5 },
  { name: "COSMOPOLITAN", description: "Elegant vodka cocktail with cranberry and lime", price: 128, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "elegant"], displayOrder: 6 },

  // PASTA
  { name: "CHORIZO JALAPENO", description: "Spicy pasta with chorizo and jalapeño peppers", price: 200, category: "Pasta", image: "Chorizojalapeno.jpg", preparationTime: 15, tags: ["spicy", "popular"], displayOrder: 7 },
  { name: "CLASSIC CARBONARA", description: "Creamy pasta with bacon, egg, and parmesan", price: 220, category: "Pasta", image: "Classiccarbonara.jpg", preparationTime: 15, tags: ["creamy", "classic"], displayOrder: 8 },
  { name: "PINOY SPAGHETTI", description: "Sweet Filipino-style spaghetti with beef", price: 180, category: "Pasta", image: "Pinostylespaghetti.jpg", preparationTime: 15, tags: ["sweet", "popular"], displayOrder: 9 },
  { name: "THICK BACON PASTA", description: "Hearty pasta loaded with crispy bacon", price: 230, category: "Pasta", image: "Thickbaconpasta.jpg", preparationTime: 15, tags: ["meaty", "bacon"], displayOrder: 10 },

  // SANDWICHES
  { name: "CRISPY CHICKEN SANDWICH", description: "Golden fried chicken on soft bun", price: 160, category: "Sandwiches", image: "Crispychickensandwich.jpg", preparationTime: 12, tags: ["chicken", "popular"], displayOrder: 11 },
  { name: "CHORIZO CHEESE", description: "Grilled chorizo with melted cheese", price: 180, category: "Sandwiches", image: "Choricocheeseburger.jpg", preparationTime: 12, tags: ["cheesy", "chorizo"], displayOrder: 12 },

  // SIDES
  { name: "CHICKEN WINGS", description: "Crispy chicken wings with your choice of flavor", price: 260, category: "Sides", image: "BuffaloWings12(2).jpg", preparationTime: 20, tags: ["chicken", "popular"], displayOrder: 13,
    modifiers: [
      { name: "Size", required: true, options: [{ name: "8pcs", price: 260 }, { name: "12pcs", price: 350 }] },
      { name: "Flavor", required: true, options: [{ name: "Buffalo", price: 0 }, { name: "BBQ", price: 0 }, { name: "Parmesan", price: 0 }] }
    ]
  },
  { name: "NACHOS WITH CHEESE", description: "Crispy nachos topped with melted cheese and jalapeños", price: 180, category: "Sides", image: "Nachos.jpg", preparationTime: 10, tags: ["snack", "cheesy"], displayOrder: 14 },
  { name: "GARLIC FRIES", description: "Crispy fries with garlic butter and parmesan", price: 120, category: "Sides", image: "", preparationTime: 8, tags: ["snack", "popular"], displayOrder: 15 },

  // RICE MEALS
  { name: "RICE WITH WINGS", description: "Fragrant rice with tender chicken wings", price: 280, category: "Rice Meals", image: "Ricewithwings.jpg", preparationTime: 18, tags: ["chicken", "filling"], displayOrder: 16 },
  { name: "CHORIZO EGG RICE", description: "Flavorful rice with chorizo and sunny-side up egg", price: 200, category: "Rice Meals", image: "Chorizo_egg_rice.jpg", preparationTime: 15, tags: ["chorizo", "egg"], displayOrder: 17 },
  { name: "TACINO RICE", description: "Savory rice with Filipino cured meat (tacino)", price: 190, category: "Rice Meals", image: "Tacinorice.jpg", preparationTime: 15, tags: ["meat", "traditional"], displayOrder: 18 },
  { name: "BACON STEAK RICE", description: "Juicy bacon steak served over fragrant rice", price: 320, category: "Rice Meals", image: "Baconsteak.jpg", preparationTime: 18, tags: ["steak", "bacon"], displayOrder: 19 },
  { name: "SEAFOOD PASTA", description: "Premium pasta with fresh seafood", price: 350, category: "Rice Meals", image: "", preparationTime: 20, tags: ["seafood", "premium"], displayOrder: 20 },

  // YOGURT MILKSHAKES
  { name: "STRAWBERRY YOGURT SHAKE", description: "Creamy strawberry yogurt milkshake", price: 95, category: "Yogurt Milkshakes", image: "", preparationTime: 5, tags: ["sweet", "fruit"], displayOrder: 21 },
  { name: "MANGO YOGURT SHAKE", description: "Tropical mango yogurt milkshake", price: 95, category: "Yogurt Milkshakes", image: "", preparationTime: 5, tags: ["sweet", "tropical"], displayOrder: 22 },
  { name: "BLUEBERRY YOGURT SHAKE", description: "Antioxidant-rich blueberry yogurt shake", price: 100, category: "Yogurt Milkshakes", image: "", preparationTime: 5, tags: ["sweet", "healthy"], displayOrder: 23 },
  { name: "GREEK YOGURT SHAKE", description: "Thick and creamy Greek yogurt shake", price: 110, category: "Yogurt Milkshakes", image: "", preparationTime: 5, tags: ["thick", "creamy"], displayOrder: 24 },

  // COFFEE
  { name: "AMERICANO", description: "Strong espresso with hot water", price: 85, category: "Coffee", image: "", preparationTime: 5, tags: ["coffee", "strong"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot", price: 0 }, { name: "Iced", price: 10 }] },
      { name: "Size", required: false, options: [{ name: "Regular", price: 0 }, { name: "Large", price: 20 }] }
    ],
    displayOrder: 25
  },
  { name: "CAFE LATTE", description: "Smooth espresso with steamed milk", price: 95, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "creamy"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot", price: 0 }, { name: "Iced", price: 10 }] },
      { name: "Size", required: false, options: [{ name: "Regular", price: 0 }, { name: "Large", price: 20 }] }
    ],
    displayOrder: 26
  },
  { name: "MOCHA", description: "Espresso with steamed milk and chocolate", price: 110, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "chocolate"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot", price: 0 }, { name: "Iced", price: 10 }] }
    ],
    displayOrder: 27
  },
  { name: "VANILLA LATTE", description: "Silky latte with vanilla flavoring", price: 105, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "vanilla"], displayOrder: 28 },
  { name: "CARAMEL LATTE", description: "Sweet latte with caramel drizzle", price: 110, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "sweet"], displayOrder: 29 },
  { name: "HAZELNUT LATTE", description: "Aromatic latte with hazelnut flavor", price: 110, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "hazelnut"], displayOrder: 30 },
  { name: "SALTED CARAMEL LATTE", description: "Perfect balance of sweet caramel and salt", price: 115, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "sweet"], displayOrder: 31 },
  { name: "SPANISH LATTE", description: "Rich latte with condensed milk", price: 105, category: "Coffee", image: "SpanishLatte.jpg", preparationTime: 6, tags: ["coffee", "creamy"], displayOrder: 32 },
  { name: "COCO-FREE LATTE", description: "Coconut milk latte for dairy-free option", price: 110, category: "Coffee", image: "", preparationTime: 6, tags: ["coffee", "vegan"], displayOrder: 33 },

  // COOLERS
  { name: "ICED LEMON TEA", description: "Refreshing iced lemon tea", price: 80, category: "Coolers", image: "", preparationTime: 5, tags: ["tea", "refreshing"], displayOrder: 34 },
  { name: "MANGO COOLER", description: "Tropical mango juice cooler", price: 90, category: "Coolers", image: "", preparationTime: 5, tags: ["juice", "tropical"], displayOrder: 35 },
  { name: "PINEAPPLE COOLER", description: "Sweet pineapple juice cooler", price: 85, category: "Coolers", image: "", preparationTime: 5, tags: ["juice", "tropical"], displayOrder: 36 },
  { name: "CUCUMBER COOLER", description: "Refreshing cucumber and lime cooler", price: 85, category: "Coolers", image: "", preparationTime: 5, tags: ["juice", "healthy"], displayOrder: 37 },
  { name: "STRAWBERRY COOLER", description: "Sweet strawberry juice cooler", price: 90, category: "Coolers", image: "", preparationTime: 5, tags: ["juice", "fruit"], displayOrder: 38 },
  { name: "WATERMELON COOLER", description: "Juicy watermelon cooler with ice", price: 85, category: "Coolers", image: "", preparationTime: 5, tags: ["juice", "refreshing"], displayOrder: 39 },
  { name: "ICED COFFEE", description: "Chilled coffee over ice", price: 90, category: "Coolers", image: "", preparationTime: 5, tags: ["coffee", "cold"], displayOrder: 40 },
  { name: "ICED TEA", description: "Classic iced tea with lemon", price: 75, category: "Coolers", image: "", preparationTime: 5, tags: ["tea", "refreshing"], displayOrder: 41 }
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
    await MenuItem.insertMany(completeMenu);
    
    console.log(`✅ Added ${completeMenu.length} menu items`);
    
    // Verify
    const count = await MenuItem.countDocuments();
    console.log(`📊 Total items in database: ${count}`);
    
    // Show breakdown by category
    const categories = await MenuItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 Items by Category:');
    categories.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} items`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

quickSeed();