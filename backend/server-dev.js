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
const forecastRoutes = require('./src/routes/forecastRoutes');
const authRoutes = require('./src/routes/authRoutes');

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
    app.use('/api/auth', authRoutes);
    app.use('/api/menu', menuRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/forecast', forecastRoutes);
    
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
        const completeMenu = require('./src/data/completeMenu');
        
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
            
            // Add default values to complete menu items
            const menuItemsWithDefaults = completeMenu.map(item => ({
                ...item,
                modifiers: item.modifiers || [],
                addons: item.addons || [],
                isAvailable: true,
                preparationTime: item.preparationTime || 15
            }));
            
            await MenuItem.insertMany(menuItemsWithDefaults);
            console.log(`✅ Seeded ${menuItemsWithDefaults.length} menu items`);
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
startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});

// Prevent crash from unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('⚠️ Uncaught Exception:', err);
    // Don't exit immediately for unhandled exceptions during startup
    setTimeout(() => process.exit(1), 1000);
});
