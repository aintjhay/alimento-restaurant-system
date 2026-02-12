const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

async function startServer() {
    console.log('🚀 Starting Alimento Restaurant API with IN-MEMORY MongoDB...');
    
    // Create in-memory MongoDB instance
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    console.log('📦 MongoDB Memory Server created');
    console.log('🔗 Connection URI:', mongoUri);
    
    // Connect to in-memory MongoDB
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to IN-MEMORY MongoDB');
        
        // Seed initial data automatically
        await seedInitialData();
        
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
    
    // Use Routes
    app.use('/api/menu', menuRoutes);
    app.use('/api/orders', orderRoutes);
    
    // Basic Route
    app.get('/', (req, res) => {
        res.json({ 
            message: 'Alimento Restaurant API (In-Memory MongoDB)',
            version: '1.0.0',
            database: 'In-Memory MongoDB',
            endpoints: {
                menu: 'GET /api/menu',
                orders: 'GET /api/orders',
                'create-order': 'POST /api/orders'
            }
        });
    });
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy',
            database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    });
    
    // 404 Handler
    app.use((req, res) => {
        res.status(404).json({ error: 'Endpoint not found' });
    });
    
    // Error Handler
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(500).json({ error: 'Internal server error' });
    });
    
    // Start Server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🎯 Server running on http://localhost:${PORT}`);
        console.log(`📊 API Documentation: http://localhost:${PORT}/`);
        console.log(`❤️  Health check: http://localhost:${PORT}/health`);
        console.log('\n💡 TIP: This uses IN-MEMORY database. Data will reset when server restarts.');
    });
}

// Function to seed initial data
async function seedInitialData() {
    try {
        // Dynamically require MenuItem model
        const MenuItem = require('./src/models/MenuItem');
        
        // Check if we already have data - use count() if countDocuments doesn't work
        let count;
        try {
            count = await MenuItem.countDocuments();
        } catch (err) {
            // Fallback to count() for older mongoose versions
            count = await MenuItem.count();
        }
        
        if (count === 0) {
            console.log('🌱 Seeding initial menu data...');
            
            const sampleMenu = [
                {
                    name: "Espresso",
                    description: "Strong Italian coffee shot",
                    price: 85,
                    category: "Coffee",
                    preparationTime: 5,
                    isAvailable: true
                },
                {
                    name: "Cappuccino",
                    description: "Creamy cappuccino with foam",
                    price: 120,
                    category: "Coffee",
                    preparationTime: 8,
                    isAvailable: true
                },
                {
                    name: "Fettuccine Alfredo",
                    description: "Creamy Alfredo pasta with parmesan",
                    price: 265,
                    category: "Pasta",
                    preparationTime: 15,
                    isAvailable: true
                },
                {
                    name: "Spaghetti Carbonara",
                    description: "Classic carbonara with bacon and cream",
                    price: 245,
                    category: "Pasta",
                    preparationTime: 12,
                    isAvailable: true
                },
                {
                    name: "Club Sandwich",
                    description: "Triple-decker with bacon, turkey, and cheese",
                    price: 185,
                    category: "Sandwiches",
                    preparationTime: 10,
                    isAvailable: true
                },
                {
                    name: "Fried Chicken Sandwich",
                    description: "Crispy chicken with pickles and mayo",
                    price: 155,
                    category: "Sandwiches",
                    preparationTime: 12,
                    isAvailable: true
                },
                {
                    name: "French Fries",
                    description: "Golden crispy fries with salt",
                    price: 65,
                    category: "Sides",
                    preparationTime: 8,
                    isAvailable: true
                },
                {
                    name: "Garlic Rice",
                    description: "Fragrant garlic fried rice",
                    price: 75,
                    category: "Rice Meals",
                    preparationTime: 10,
                    isAvailable: true
                },
                {
                    name: "Mango Yogurt Shake",
                    description: "Smooth mango and yogurt blend",
                    price: 95,
                    category: "Yogurt Milkshakes",
                    preparationTime: 5,
                    isAvailable: true
                },
                {
                    name: "Strawberry Cooler",
                    description: "Refreshing strawberry drink with ice",
                    price: 75,
                    category: "Coolers",
                    preparationTime: 3,
                    isAvailable: true
                },
                {
                    name: "Margarita",
                    description: "Classic margarita with tequila and lime",
                    price: 185,
                    category: "Cocktails",
                    preparationTime: 8,
                    isAvailable: true
                }
            ];
            
            await MenuItem.insertMany(sampleMenu);
            console.log(`✅ Seeded ${sampleMenu.length} menu items`);
        } else {
            console.log(`✅ Database already has ${count} menu items`);
        }
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        // Continue even if seeding fails
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Server shutting down...');
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
    process.exit(0);
});

// Start the server
startServer().catch(console.error);
