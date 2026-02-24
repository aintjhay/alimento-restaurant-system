const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

const completeMenu = [
  { name: 'TEQUILA SUNRISE', description: 'Vibrant tequila cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'popular'], displayOrder: 1 },
  { name: 'MOJITO', description: 'Refreshing Cuban cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'refreshing'], displayOrder: 2 },
  { name: 'AMARETTO SOUR', description: 'Sweet sour cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'sweet'], displayOrder: 3 },
  { name: 'WHISKY-RETTO', description: 'Whisky cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'classic'], displayOrder: 4 },
  { name: 'FROZEN BLUEBERRY DAIQUIRI', description: 'Frozen rum cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 10, tags: ['alcoholic', 'frozen'], displayOrder: 5 },
  { name: 'BLUE LAGOON', description: 'Blue vodka cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'colorful'], displayOrder: 6 },
  { name: 'MARGARITA', description: 'Classic tequila cocktail', price: 110, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'classic'], displayOrder: 7 },
  { name: 'PURPLE HEARTS', description: 'Violet cocktail', price: 100, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'colorful'], displayOrder: 8 },
  { name: 'WHISKY SOUR', description: 'Whisky cocktail with lemon', price: 90, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'classic'], displayOrder: 9 },
  { name: 'WHISKY COKE', description: 'Whisky with Coke', price: 90, category: 'Cocktails', image: '', preparationTime: 5, tags: ['alcoholic', 'simple'], displayOrder: 10 },
  { name: 'GIN TONIC', description: 'Gin and tonic', price: 90, category: 'Cocktails', image: '', preparationTime: 5, tags: ['alcoholic', 'classic'], displayOrder: 11 },
  { name: 'TEQUILA SHOT', description: 'Tequila shot', price: 50, category: 'Cocktails', image: '', preparationTime: 2, tags: ['alcoholic', 'strong'], displayOrder: 12 },
  { name: 'CHORIZO JALAPENO', description: 'Spicy pasta with chorizo', price: 200, category: 'Pasta', image: 'Chorizojalapeno.jpg', preparationTime: 15, tags: ['spicy', 'popular'], displayOrder: 13 },
  { name: 'CLASSIC CARBONARA', description: 'Creamy pasta', price: 220, category: 'Pasta', image: 'Classiccarbonara.jpg', preparationTime: 15, tags: ['creamy', 'classic'], displayOrder: 14 },
  { name: 'SPANISH STYLE', description: 'Spanish pasta', price: 190, category: 'Pasta', image: 'SpanishStyle.jpg', preparationTime: 15, tags: ['spicy', 'spanish'], displayOrder: 15 },
  { name: 'PINOY STYLE', description: 'Filipino pasta', price: 190, category: 'Pasta', image: 'Pinoystyle.jpg', preparationTime: 15, tags: ['sweet', 'local'], displayOrder: 16 },
  { name: 'SEAFOOD PASTA', description: 'Seafood pasta', price: 220, category: 'Pasta', image: '', preparationTime: 20, tags: ['seafood', 'premium'], displayOrder: 17 },
  { name: 'THICK CUT BACON', description: 'Bacon sandwich', price: 180, category: 'Sandwiches', image: 'ThickCutBacon.jpg', preparationTime: 12, tags: ['bacon', 'popular'], displayOrder: 18, addons: [{ name: 'Add Cajun Fries', price: 50 }] },
  { name: 'CRISPY CHIX', description: 'Chicken sandwich', price: 170, category: 'Sandwiches', image: 'CrispyChix.jpg', preparationTime: 15, tags: ['chicken', 'popular'], displayOrder: 19, modifiers: [{ name: 'Flavor', required: true, options: [{ name: 'Buffalo', price: 0 }, { name: 'BBQ', price: 0 }] }], addons: [{ name: 'Add Cajun Fries', price: 50 }] },
  { name: 'CHORI CHEESEBURGER', description: 'Chorizo burger', price: 180, category: 'Sandwiches', image: 'Choricheeseburger.jpg', preparationTime: 15, tags: ['chorizo', 'burger'], displayOrder: 20, addons: [{ name: 'Add Cajun Fries', price: 50 }] },
  { name: 'BBQ CHEESEBURGER', description: 'BBQ burger', price: 190, category: 'Sandwiches', image: '', preparationTime: 15, tags: ['burger', 'bbq'], displayOrder: 21, addons: [{ name: 'Add Cajun Fries', price: 50 }] },
  { name: 'NACHORIZO', description: 'Nachos with chorizo', price: 190, category: 'Sides', image: 'Nachorizo.jpg', preparationTime: 10, tags: ['chorizo', 'snack'], displayOrder: 22 },
  { name: 'CAJUN FRIES', description: 'Cajun fries', price: 130, category: 'Sides', image: '', preparationTime: 8, tags: ['fries', 'snack'], displayOrder: 23 },
  { name: 'CHICKEN WINGS', description: 'Crispy chicken wings with your choice of flavor', price: 260, category: 'Sides', image: 'BuffaloWings12s_2.jpg', preparationTime: 20, tags: ['chicken', 'popular'], displayOrder: 24, modifiers: [{ name: 'Size', required: true, options: [{ name: '8pcs', price: 260 }, { name: '12pcs', price: 350 }] }, { name: 'Flavor', required: true, options: [{ name: 'Buffalo', price: 0 }, { name: 'BBQ', price: 0 }, { name: 'Parmesan', price: 0 }] }] },
  { name: 'CHICKEN WINGS RICE MEAL', description: 'Wings with rice', price: 160, category: 'Rice Meals', image: 'Buffalowingsricemeal.jpg', preparationTime: 15, tags: ['chicken', 'rice'], displayOrder: 25 },
  { name: 'BURGER STEAK RICE MEAL', description: 'Burger steak rice', price: 170, category: 'Rice Meals', image: '', preparationTime: 15, tags: ['beef', 'rice'], displayOrder: 26 },
  { name: 'HOMEMADE CHORIZO WITH EGG', description: 'Chorizo with egg', price: 160, category: 'Rice Meals', image: 'Homemadechorizo.jpg', preparationTime: 12, tags: ['chorizo', 'egg'], displayOrder: 27 },
  { name: 'CHICKEN TOCINO WITH EGG', description: 'Tocino with egg', price: 170, category: 'Rice Meals', image: 'Chickentocino.jpg', preparationTime: 12, tags: ['chicken', 'sweet'], displayOrder: 28 },
  { name: 'BACON STEAK WITH EGG', description: 'Bacon steak rice', price: 180, category: 'Rice Meals', image: 'Baconsteak.jpg', preparationTime: 12, tags: ['bacon', 'egg'], displayOrder: 29 },
  { name: 'MANGO YOGURT MILKSHAKE', description: 'Mango yogurt shake', price: 120, category: 'Yogurt Milkshakes', image: '', preparationTime: 8, tags: ['dessert', 'refreshing'], displayOrder: 30 },
  { name: 'STRAWBERRY YOGURT MILKSHAKE', description: 'Strawberry yogurt shake', price: 120, category: 'Yogurt Milkshakes', image: '', preparationTime: 8, tags: ['dessert', 'refreshing'], displayOrder: 31 },
  { name: 'BLUEBERRY YOGURT MILKSHAKE', description: 'Blueberry yogurt shake', price: 120, category: 'Yogurt Milkshakes', image: '', preparationTime: 8, tags: ['dessert', 'refreshing'], displayOrder: 32 },
  { name: 'AMERICANO', description: 'Black coffee', price: 70, category: 'Coffee', image: '', preparationTime: 5, tags: ['coffee', 'classic'], displayOrder: 33, modifiers: [{ name: 'Temperature', required: true, options: [{ name: 'Hot', price: 60 }, { name: 'Cold', price: 70 }] }], addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'CAFE LATTE', description: 'Coffee latte', price: 100, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'milk'], displayOrder: 34, modifiers: [{ name: 'Temperature', required: true, options: [{ name: 'Hot', price: 90 }, { name: 'Cold', price: 100 }] }], addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'CAFE MOCHA', description: 'Mocha coffee', price: 100, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'chocolate'], displayOrder: 35, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'VANILLA LATTE', description: 'Vanilla latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'vanilla'], displayOrder: 36, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'SPANISH LATTE', description: 'Spanish latte', price: 105, category: 'Coffee', image: 'SpanishLatte.jpg', preparationTime: 7, tags: ['coffee', 'sweet'], displayOrder: 37, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'CARAMEL LATTE', description: 'Caramel latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'caramel'], displayOrder: 38, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'HAZELNUT LATTE', description: 'Hazelnut latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'nutty'], displayOrder: 39, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'SALTED LATTE', description: 'Salted latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'salted'], displayOrder: 40, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'SALTED CARAMEL LATTE', description: 'Salted caramel latte', price: 110, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'caramel'], displayOrder: 41, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'COCO-FREE (COCONUT MILK LATTE)', description: 'Coconut latte', price: 110, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'vegan'], displayOrder: 42, addons: [{ name: 'Add Double Shot', price: 25 }] },
  { name: 'ALIMENTO SUNRISE', description: 'Sunrise cooler', price: 140, category: 'Coolers', image: '', preparationTime: 5, tags: ['refreshing', 'popular'], displayOrder: 43, modifiers: [{ name: 'Temperature', required: true, options: [{ name: 'Hot', price: 75 }, { name: 'Cold', price: 140 }] }] },
  { name: 'ALIMENTO CUCUMBER LEMONADE', description: 'Cucumber lemonade', price: 140, category: 'Coolers', image: '', preparationTime: 5, tags: ['refreshing', 'healthy'], displayOrder: 44, modifiers: [{ name: 'Temperature', required: true, options: [{ name: 'Hot', price: 75 }, { name: 'Cold', price: 140 }] }] },
  { name: 'ALIMENTO ICED TEA', description: 'Iced tea', price: 140, category: 'Coolers', image: '', preparationTime: 5, tags: ['refreshing', 'tea'], displayOrder: 45, modifiers: [{ name: 'Temperature', required: true, options: [{ name: 'Hot', price: 75 }, { name: 'Cold', price: 140 }] }] },
  { name: 'COKE', description: 'Coca-Cola', price: 65, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'popular'], displayOrder: 46 },
  { name: 'COKE ZERO', description: 'Coke Zero', price: 65, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'zero-sugar'], displayOrder: 47 },
  { name: 'SPRITE', description: 'Sprite soda', price: 65, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'lemon-lime'], displayOrder: 48 },
  { name: 'RITE N LITE', description: 'Rite n lite drink', price: 60, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'light'], displayOrder: 49 }
];

async function seed() {
  try {
    await mongoose.connect('mongodb://localhost:27017/alimento', { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');
    
    await MenuItem.deleteMany({});
    await MenuItem.insertMany(completeMenu);
    
    console.log(`✅ Added ${completeMenu.length} menu items`);
    
    const count = await MenuItem.countDocuments();
    console.log(`📊 Total items: ${count}`);
    
    const cats = await MenuItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n📊 By Category:');
    cats.forEach(c => console.log(`   ${c._id}: ${c.count}`));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();
