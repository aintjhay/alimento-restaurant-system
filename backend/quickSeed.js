const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

// Complete menu with all 50+ items - EXACT from Alimento menu
const completeMenu = [
  // COCKTAILS - 12 items
  { name: "TEQUILA SUNRISE", description: "Vibrant tequila cocktail", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "popular"], displayOrder: 1 },
  { name: "MOJITO", description: "Refreshing mint rum cocktail", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "refreshing"], displayOrder: 2 },
  { name: "AMARETTO SOUR", description: "Sweet and sour cocktail with amaretto", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], displayOrder: 3 },
  { name: "WHISKY-RETTO", description: "Classic whisky cocktail with a twist", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], displayOrder: 4 },
  { name: "FROZEN BLUEBERRY DAIQUIRI", description: "Frozen rum cocktail with fresh blueberries", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "frozen"], displayOrder: 5 },
  { name: "BLUE LAGOON", description: "Blue vodka cocktail", price: 120, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], displayOrder: 6 },
  { name: "MARGARITA", description: "Classic tequila cocktail", price: 110, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic", "classic"], displayOrder: 7 },
  { name: "PURPLE HEARTS", description: "Violet cocktail", price: 100, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], displayOrder: 8 },
  { name: "WHISKY SOUR", description: "Whisky cocktail with lemon", price: 90, category: "Cocktails", image: "", preparationTime: 8, tags: ["alcoholic"], displayOrder: 9 },
  { name: "WHISKY COKE", description: "Whisky with Coke", price: 90, category: "Cocktails", image: "", preparationTime: 5, tags: ["alcoholic"], displayOrder: 10 },
  { name: "GIN TONIC", description: "Gin and tonic", price: 90, category: "Cocktails", image: "", preparationTime: 5, tags: ["alcoholic"], displayOrder: 11 },
  { name: "TEQUILA SHOT", description: "Tequila shot", price: 50, category: "Cocktails", image: "", preparationTime: 2, tags: ["alcoholic"], displayOrder: 12 },

  // PASTA - 5 items
  { name: "CHORIZO JALAPENO", description: "Spicy pasta with chorizo and jalapeño", price: 200, category: "Pasta", image: "Chorizojalapeno.jpg", preparationTime: 15, tags: ["spicy", "popular"], displayOrder: 13 },
  { name: "CLASSIC CARBONARA", description: "Creamy pasta with bacon, egg, and parmesan", price: 220, category: "Pasta", image: "Classiccarbonara.jpg", preparationTime: 15, tags: ["creamy", "classic"], displayOrder: 14 },
  { name: "SPANISH STYLE", description: "Spanish style pasta", price: 190, category: "Pasta", image: "SpanishStyle.jpg", preparationTime: 15, tags: ["spanish"], displayOrder: 15 },
  { name: "PINOY STYLE", description: "Filipino style pasta", price: 190, category: "Pasta", image: "Pinoystyle.jpg", preparationTime: 15, tags: ["sweet", "popular"], displayOrder: 16 },
  { name: "SEAFOOD PASTA", description: "Premium pasta with fresh seafood", price: 220, category: "Pasta", image: "", preparationTime: 20, tags: ["seafood", "premium"], displayOrder: 17 },

  // SANDWICHES - 4 items (with Cajun Fries add-on)
  { name: "THICK CUT BACON", description: "Bacon sandwich", price: 180, category: "Sandwiches", image: "ThickCutBacon.jpg", preparationTime: 12, tags: ["bacon", "popular"], displayOrder: 18,
    addons: [
      { name: "Cajun Fries", price: 50 }
    ]
  },
  { name: "CRISPY CHIX", description: "Crispy chicken sandwich with choice of sauce", price: 170, category: "Sandwiches", image: "CrispyChix.jpg", preparationTime: 15, tags: ["chicken", "popular"], displayOrder: 19,
    modifiers: [
      { name: "Flavor", required: true, options: [{ name: "Buffalo", price: 0 }, { name: "BBQ", price: 0 }] }
    ],
    addons: [
      { name: "Cajun Fries", price: 50 }
    ]
  },
  { name: "CHORI CHEESEBURGER", description: "Chorizo burger with melted cheese", price: 180, category: "Sandwiches", image: "Choricheeseburger.jpg", preparationTime: 15, tags: ["chorizo", "burger"], displayOrder: 20,
    addons: [
      { name: "Cajun Fries", price: 50 }
    ]
  },
  { name: "BBQ CHEESEBURGER", description: "BBQ burger with cheese", price: 190, category: "Sandwiches", image: "Choricheeseburger2.jpg", preparationTime: 15, tags: ["burger", "bbq"], displayOrder: 21,
    addons: [
      { name: "Cajun Fries", price: 50 }
    ]
  },

  // SIDES - 3 items
  { name: "NACHORIZO", description: "Nachos with chorizo", price: 190, category: "Sides", image: "Nachorizo.jpg", preparationTime: 10, tags: ["chorizo", "snack"], displayOrder: 22 },
  { name: "CAJUN FRIES", description: "Cajun fries", price: 130, category: "Sides", image: "placeholder.jpg", preparationTime: 8, tags: ["fries", "snack"], displayOrder: 23 },
  { name: "CHICKEN WINGS", description: "Crispy chicken wings", price: 260, category: "Sides", image: "Buffalowings12s.jpg", preparationTime: 20, tags: ["chicken", "popular"], displayOrder: 24,
    modifiers: [
      { name: "Size", required: true, options: [{ name: "8pcs", price: 0 }, { name: "12pcs", price: 90 }] },
      { name: "Flavor", required: true, options: [{ name: "Buffalo", price: 0 }, { name: "BBQ", price: 0 }, { name: "Parmesan", price: 0 }] }
    ]
  },

  // RICE MEALS - 5 items
  { name: "CHICKEN WINGS RICE MEAL", description: "Chicken wings with rice", price: 160, category: "Rice Meals", image: "Buffalowingsricemeal.jpg", preparationTime: 15, tags: ["chicken", "rice"], displayOrder: 25 },
  { name: "BURGER STEAK RICE MEAL", description: "Burger steak with rice", price: 170, category: "Rice Meals", image: "", preparationTime: 15, tags: ["beef", "rice"], displayOrder: 26 },
  { name: "HOMEMADE CHORIZO WITH EGG", description: "Chorizo with egg and rice", price: 160, category: "Rice Meals", image: "Homemadechorizo.jpg", preparationTime: 12, tags: ["chorizo", "egg"], displayOrder: 27 },
  { name: "CHICKEN TOCINO WITH EGG", description: "Tocino with egg and rice", price: 170, category: "Rice Meals", image: "Chickentocino.jpg", preparationTime: 12, tags: ["chicken", "sweet"], displayOrder: 28 },
  { name: "BACON STEAK WITH EGG", description: "Bacon steak with egg and rice", price: 180, category: "Rice Meals", image: "Baconsteak.jpg", preparationTime: 12, tags: ["bacon", "egg"], displayOrder: 29 },

  // YOGURT MILKSHAKES - 3 items
  { name: "MANGO YOGURT MILKSHAKE", description: "Mango yogurt milkshake", price: 120, category: "Yogurt Milkshakes", image: "", preparationTime: 8, tags: ["dessert", "tropical"], displayOrder: 30 },
  { name: "STRAWBERRY YOGURT MILKSHAKE", description: "Strawberry yogurt milkshake", price: 120, category: "Yogurt Milkshakes", image: "", preparationTime: 8, tags: ["dessert", "fruit"], displayOrder: 31 },
  { name: "BLUEBERRY YOGURT MILKSHAKE", description: "Blueberry yogurt milkshake", price: 120, category: "Yogurt Milkshakes", image: "", preparationTime: 8, tags: ["dessert", "healthy"], displayOrder: 32 },

  // COFFEE - 10 items (with double shot and temp modifiers)
  { name: "AMERICANO", description: "Strong Italian espresso with hot water", price: 60, category: "Coffee", image: "Coffee.jpg", preparationTime: 5, tags: ["coffee", "strong"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot (₱60)", price: 0 }, { name: "Cold (₱70)", price: 10 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 33
  },
  { name: "CAFE LATTE", description: "Espresso with steamed milk", price: 90, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "creamy"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot (₱90)", price: 0 }, { name: "Cold (₱100)", price: 10 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 34
  },
  { name: "CAFE MOCHA", description: "Espresso with steamed milk and chocolate", price: 100, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "chocolate"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 35
  },
  { name: "VANILLA LATTE", description: "Latte with vanilla flavoring", price: 105, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "vanilla"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 36
  },
  { name: "SPANISH LATTE", description: "Latte with condensed milk", price: 105, category: "Coffee", image: "SpanishLatte.jpg", preparationTime: 6, tags: ["coffee", "creamy"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 37
  },
  { name: "CARAMEL LATTE", description: "Latte with caramel drizzle", price: 105, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "sweet"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 38
  },
  { name: "HAZELNUT LATTE", description: "Latte with hazelnut flavor", price: 105, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "hazelnut"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 39
  },
  { name: "SALTED LATTE", description: "Latte with a pinch of salt", price: 105, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "salted"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 40
  },
  { name: "SALTED CARAMEL LATTE", description: "Perfect balance of sweet and salt", price: 110, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "sweet"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 41
  },
  { name: "COCO-FREE (COCONUT MILK LATTE)", description: "Coconut milk latte for dairy-free", price: 110, category: "Coffee", image: "Coffee.jpg", preparationTime: 6, tags: ["coffee", "vegan"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Cold", price: 0 }] },
      { name: "Shot", required: false, options: [{ name: "Single Shot", price: 0 }, { name: "Double Shot", price: 25 }] }
    ],
    displayOrder: 42
  },

  // COOLERS - 5 items
  { name: "ALIMENTO SUNRISE", description: "Special sunrise cooler", price: 75, category: "Coolers", image: "", preparationTime: 5, tags: ["refreshing"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot (₱75)", price: 0 }, { name: "Cold (₱140)", price: 65 }] }
    ],
    displayOrder: 43
  },
  { name: "ALIMENTO CUCUMBER LEMONADE", description: "Cucumber lemonade", price: 75, category: "Coolers", image: "", preparationTime: 5, tags: ["refreshing"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot (₱75)", price: 0 }, { name: "Cold (₱140)", price: 65 }] }
    ],
    displayOrder: 44
  },
  { name: "ALIMENTO ICED TEA", description: "Alimento iced tea", price: 75, category: "Coolers", image: "", preparationTime: 5, tags: ["tea"],
    modifiers: [
      { name: "Temperature", required: true, options: [{ name: "Hot (₱75)", price: 0 }, { name: "Cold (₱140)", price: 65 }] }
    ],
    displayOrder: 45
  },
  { name: "COKE", description: "Coca-Cola soft drink", price: 65, category: "Coolers", image: "", preparationTime: 2, tags: ["soda"], displayOrder: 46 },
  { name: "COKE ZERO", description: "Coca-Cola Zero sugar", price: 65, category: "Coolers", image: "", preparationTime: 2, tags: ["soda"], displayOrder: 47 },
  { name: "SPRITE", description: "Lemon-lime soft drink", price: 65, category: "Coolers", image: "", preparationTime: 2, tags: ["soda"], displayOrder: 48 },
  { name: "RITE N LITE", description: "Rite n Lite beverage", price: 60, category: "Coolers", image: "", preparationTime: 2, tags: ["soda"], displayOrder: 49 }
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