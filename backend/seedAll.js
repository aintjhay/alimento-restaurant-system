const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

const completeMenu = [
  { name: 'TEQUILA SUNRISE', description: 'Vibrant tequila cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'popular'], displayOrder: 1, modifiers: [], addons: [] },
  { name: 'MOJITO', description: 'Refreshing Cuban cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'refreshing'], displayOrder: 2, modifiers: [], addons: [] },
  { name: 'AMARETTO SOUR', description: 'Sweet sour cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'sweet'], displayOrder: 3, modifiers: [], addons: [] },
  { name: 'WHISKY-RETTO', description: 'Whisky cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'classic'], displayOrder: 4, modifiers: [], addons: [] },
  { name: 'FROZEN BLUEBERRY DAIQUIRI', description: 'Frozen rum cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 10, tags: ['alcoholic', 'frozen'], displayOrder: 5, modifiers: [], addons: [] },
  { name: 'BLUE LAGOON', description: 'Blue vodka cocktail', price: 120, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'colorful'], displayOrder: 6, modifiers: [], addons: [] },
  { name: 'MARGARITA', description: 'Classic tequila cocktail', price: 110, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'classic'], displayOrder: 7, modifiers: [], addons: [] },
  { name: 'PURPLE HEARTS', description: 'Violet cocktail', price: 100, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'colorful'], displayOrder: 8, modifiers: [], addons: [] },
  { name: 'WHISKY SOUR', description: 'Whisky cocktail with lemon', price: 90, category: 'Cocktails', image: '', preparationTime: 8, tags: ['alcoholic', 'classic'], displayOrder: 9, modifiers: [], addons: [] },
  { name: 'WHISKY COKE', description: 'Whisky with Coke', price: 90, category: 'Cocktails', image: '', preparationTime: 5, tags: ['alcoholic', 'simple'], displayOrder: 10, modifiers: [], addons: [] },
  { name: 'GIN TONIC', description: 'Gin and tonic', price: 90, category: 'Cocktails', image: '', preparationTime: 5, tags: ['alcoholic', 'classic'], displayOrder: 11, modifiers: [], addons: [] },
  { name: 'TEQUILA SHOT', description: 'Tequila shot', price: 50, category: 'Cocktails', image: '', preparationTime: 2, tags: ['alcoholic', 'strong'], displayOrder: 12, modifiers: [], addons: [] },
  { name: 'CHORIZO JALAPENO', description: 'Spicy pasta with chorizo', price: 200, category: 'Pasta', image: 'Chorizojalapeno.jpg', preparationTime: 15, tags: ['spicy', 'popular'], displayOrder: 13, modifiers: [], addons: [] },
  { name: 'CLASSIC CARBONARA', description: 'Creamy pasta', price: 220, category: 'Pasta', image: 'Classiccarbonara.jpg', preparationTime: 15, tags: ['creamy', 'classic'], displayOrder: 14, modifiers: [], addons: [] },
  { name: 'SPANISH STYLE', description: 'Spanish pasta', price: 190, category: 'Pasta', image: 'SpanishStyle.jpg', preparationTime: 15, tags: ['spicy', 'spanish'], displayOrder: 15, modifiers: [], addons: [] },
  { name: 'FILIPINO STYLE', description: 'Filipino pasta', price: 190, category: 'Pasta', image: 'Pinoystyle.jpg', preparationTime: 15, tags: ['sweet', 'local'], displayOrder: 16, modifiers: [], addons: [] },
  { name: 'SEAFOOD PASTA', description: 'Seafood pasta', price: 220, category: 'Pasta', image: '', preparationTime: 20, tags: ['seafood', 'premium'], displayOrder: 17, modifiers: [], addons: [] },
  { name: 'THICK CUT BACON', description: 'Bacon sandwich', price: 180, category: 'Sandwiches', image: 'ThickCutBacon.jpg', preparationTime: 12, tags: ['bacon', 'popular'], displayOrder: 18, modifiers: [], addons: [{ name: 'Cajun Fries', price: 50 }] },
  { name: 'CRISPY CHIX', description: 'Chicken sandwich', price: 170, category: 'Sandwiches', image: 'CrispyChix.jpg', preparationTime: 15, tags: ['chicken', 'popular'], displayOrder: 19, modifiers: [{ name: 'Flavor', required: false, options: [{ name: 'Buffalo', price: 0 }, { name: 'BBQ', price: 0 }] }], addons: [{ name: 'Cajun Fries', price: 50 }] },
  { name: 'CHORI CHEESEBURGER', description: 'Chorizo burger', price: 180, category: 'Sandwiches', image: 'Choricheeseburger.jpg', preparationTime: 15, tags: ['chorizo', 'burger'], displayOrder: 20, modifiers: [], addons: [{ name: 'Cajun Fries', price: 50 }] },
  { name: 'BBQ CHEESEBURGER', description: 'BBQ burger', price: 190, category: 'Sandwiches', image: '', preparationTime: 15, tags: ['burger', 'bbq'], displayOrder: 21, modifiers: [], addons: [{ name: 'Cajun Fries', price: 50 }] },
  { name: 'NACHORIZO', description: 'Nachos with chorizo', price: 190, category: 'Sides', image: 'Nachorizo.jpg', preparationTime: 10, tags: ['chorizo', 'snack'], displayOrder: 22, modifiers: [], addons: [] },
  { name: 'CAJUN FRIES', description: 'Cajun fries', price: 130, category: 'Sides', image: '', preparationTime: 8, tags: ['fries', 'snack'], displayOrder: 23, modifiers: [], addons: [] },
  { name: 'CHICKEN WINGS', description: 'Chicken wings', price: 260, category: 'Sides', image: 'BuffaloWings12s(2).jpg', preparationTime: 20, tags: ['chicken', 'popular'], displayOrder: 24, modifiers: [{ name: 'Size', required: false, options: [{ name: '8pcs - ₱260', price: 0 }, { name: '12pcs - ₱350', price: 90 }] }, { name: 'Flavor', required: false, options: [{ name: 'Buffalo', price: 0 }, { name: 'BBQ', price: 0 }, { name: 'Parmesan', price: 0 }] }], addons: [] },
  { name: 'CHICKEN WINGS RICE MEAL', description: 'Wings with rice', price: 160, category: 'Rice Meals', image: 'Buffalowingsricemeal.jpg', preparationTime: 15, tags: ['chicken', 'rice'], displayOrder: 25, modifiers: [], addons: [] },
  { name: 'BURGER STEAK RICE MEAL', description: 'Burger steak rice', price: 170, category: 'Rice Meals', image: '', preparationTime: 15, tags: ['beef', 'rice'], displayOrder: 26, modifiers: [], addons: [] },
  { name: 'HOMEMADE CHORIZO WITH EGG', description: 'Chorizo with egg', price: 160, category: 'Rice Meals', image: 'Homemadechorizo.jpg', preparationTime: 12, tags: ['chorizo', 'egg'], displayOrder: 27, modifiers: [], addons: [] },
  { name: 'CHICKEN TOCINO WITH EGG', description: 'Tocino with egg', price: 170, category: 'Rice Meals', image: 'Chickentocino.jpg', preparationTime: 12, tags: ['chicken', 'sweet'], displayOrder: 28, modifiers: [], addons: [] },
  { name: 'BACON STEAK WITH EGG', description: 'Bacon steak rice', price: 180, category: 'Rice Meals', image: 'Baconsteak.jpg', preparationTime: 12, tags: ['bacon', 'egg'], displayOrder: 29, modifiers: [], addons: [] },
  { name: 'MANGO YOGURT MILKSHAKE', description: 'Mango yogurt shake', price: 120, category: 'Yogurt Milkshakes', image: '', preparationTime: 8, tags: ['dessert', 'refreshing'], displayOrder: 30, modifiers: [], addons: [] },
  { name: 'STRAWBERRY YOGURT MILKSHAKE', description: 'Strawberry yogurt shake', price: 120, category: 'Yogurt Milkshakes', image: '', preparationTime: 8, tags: ['dessert', 'refreshing'], displayOrder: 31, modifiers: [], addons: [] },
  { name: 'BLUEBERRY YOGURT MILKSHAKE', description: 'Blueberry yogurt shake', price: 120, category: 'Yogurt Milkshakes', image: '', preparationTime: 8, tags: ['dessert', 'refreshing'], displayOrder: 32, modifiers: [], addons: [] },
  { name: 'AMERICANO', description: 'Black coffee', price: 60, category: 'Coffee', image: '', preparationTime: 5, tags: ['coffee', 'classic'], displayOrder: 33, modifiers: [{ name: 'Temperature', required: false, options: [{ name: 'Hot - ₱60', price: 0 }, { name: 'Cold - ₱70', price: 10 }] }], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'CAFE LATTE', description: 'Coffee latte', price: 90, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'milk'], displayOrder: 34, modifiers: [{ name: 'Temperature', required: false, options: [{ name: 'Hot - ₱90', price: 0 }, { name: 'Cold - ₱100', price: 10 }] }], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'CAFE MOCHA', description: 'Mocha coffee', price: 100, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'chocolate'], displayOrder: 35, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'VANILLA LATTE', description: 'Vanilla latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'vanilla'], displayOrder: 36, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'SPANISH LATTE', description: 'Spanish latte', price: 105, category: 'Coffee', image: 'SpanishLatte.jpg', preparationTime: 7, tags: ['coffee', 'sweet'], displayOrder: 37, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'CARAMEL LATTE', description: 'Caramel latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'caramel'], displayOrder: 38, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'HAZELNUT LATTE', description: 'Hazelnut latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'nutty'], displayOrder: 39, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'SALTED LATTE', description: 'Salted latte', price: 105, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'salted'], displayOrder: 40, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'SALTED CARAMEL LATTE', description: 'Salted caramel latte', price: 110, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'caramel'], displayOrder: 41, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'COCO-FREE (COCONUT MILK LATTE)', description: 'Coconut latte', price: 110, category: 'Coffee', image: '', preparationTime: 7, tags: ['coffee', 'vegan'], displayOrder: 42, modifiers: [], addons: [{ name: 'Double Shot', price: 25 }] },
  { name: 'ALIMENTO SUNRISE', description: 'Sunrise cooler', price: 75, category: 'Coolers', image: '', preparationTime: 5, tags: ['refreshing', 'popular'], displayOrder: 43, modifiers: [{ name: 'Temperature', required: false, options: [{ name: 'Hot - ₱75', price: 0 }, { name: 'Cold - ₱140', price: 65 }] }], addons: [] },
  { name: 'ALIMENTO CUCUMBER LEMONADE', description: 'Cucumber lemonade', price: 75, category: 'Coolers', image: '', preparationTime: 5, tags: ['refreshing', 'healthy'], displayOrder: 44, modifiers: [{ name: 'Temperature', required: false, options: [{ name: 'Hot - ₱75', price: 0 }, { name: 'Cold - ₱140', price: 65 }] }], addons: [] },
  { name: 'ALIMENTO ICED TEA', description: 'Iced tea', price: 75, category: 'Coolers', image: '', preparationTime: 5, tags: ['refreshing', 'tea'], displayOrder: 45, modifiers: [{ name: 'Temperature', required: false, options: [{ name: 'Hot - ₱75', price: 0 }, { name: 'Cold - ₱140', price: 65 }] }], addons: [] },
  { name: 'COKE', description: 'Coca-Cola', price: 65, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'popular'], displayOrder: 46, modifiers: [], addons: [] },
  { name: 'COKE ZERO', description: 'Coke Zero', price: 65, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'zero-sugar'], displayOrder: 47, modifiers: [], addons: [] },
  { name: 'SPRITE', description: 'Sprite soda', price: 65, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'lemon-lime'], displayOrder: 48, modifiers: [], addons: [] },
  { name: 'RITE N LITE', description: 'Rite n lite drink', price: 60, category: 'Coolers', image: '', preparationTime: 2, tags: ['soda', 'light'], displayOrder: 49, modifiers: [], addons: [] }
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
