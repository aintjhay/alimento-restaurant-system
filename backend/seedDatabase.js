require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

const sampleMenu = [
    {
        name: "Alimento Signature Burger",
        description: "100% beef patty with cheese, lettuce, tomato, and special sauce",
        price: 185,
        category: "Meals",
        preparationTime: 15
    },
    {
        name: "Crispy Chicken Wings",
        description: "6 pieces of crispy chicken wings with buffalo sauce",
        price: 220,
        category: "Meals",
        preparationTime: 20
    },
    {
        name: "Seafood Pasta Alfredo",
        description: "Creamy Alfredo pasta with shrimp and mussels",
        price: 265,
        category: "Meals",
        preparationTime: 25
    },
    {
        name: "Caesar Salad",
        description: "Fresh romaine lettuce with Caesar dressing and croutons",
        price: 125,
        category: "Appetizers",
        preparationTime: 10
    },
    {
        name: "Iced Tea (Bottomless)",
        description: "Refreshing brewed iced tea with free refills",
        price: 45,
        category: "Drinks",
        preparationTime: 5
    },
    {
        name: "Coke / Pepsi",
        description: "Carbonated soft drink",
        price: 35,
        category: "Drinks",
        preparationTime: 2
    },
    {
        name: "Chocolate Lava Cake",
        description: "Warm chocolate cake with molten center, served with vanilla ice cream",
        price: 95,
        category: "Desserts",
        preparationTime: 8
    },
    {
        name: "Garlic Rice with Egg",
        description: "Fried garlic rice with sunny-side-up egg",
        price: 75,
        category: "Breakfast",
        preparationTime: 10
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alimento');
        console.log('Connected to MongoDB');
        
        // Clear existing menu items
        await MenuItem.deleteMany({});
        console.log('Cleared existing menu items');
        
        // Insert new items
        await MenuItem.insertMany(sampleMenu);
        console.log(`Added ${sampleMenu.length} sample menu items`);
        
        console.log('✅ Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seed();
