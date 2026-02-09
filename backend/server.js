const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/alimento', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('✅ Connected to MongoDB');
});

// Import Routes
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

// Use Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alimento Restaurant API',
    version: '1.0.0',
    database: 'MongoDB',
    endpoints: {
      menu: {
        allItems: 'GET /api/menu',
        categories: 'GET /api/menu/categories/list',
        byCategory: 'GET /api/menu/category/:category',
        singleItem: 'GET /api/menu/:id',
        completeData: 'GET /api/menu/complete'
      },
      orders: {
        create: 'POST /api/orders',
        all: 'GET /api/orders',
        today: 'GET /api/orders/today',
        topItems: 'GET /api/orders/top-items',
        updateStatus: 'PATCH /api/orders/:id/status'
      }
    },
    note: 'All menu data includes modifiers, addons, and images'
  });
});

// Health check
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: {
      home: 'GET /',
      health: 'GET /health',
      menu: 'GET /api/menu',
      orders: 'GET /api/orders'
    }
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n=======================================`);
  console.log(`🚀 Alimento Restaurant API Started`);
  console.log(`=======================================`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: MongoDB`);
  console.log(`\n🔗 Available Endpoints:`);
  console.log(`   • Home: http://localhost:${PORT}/`);
  console.log(`   • Health: http://localhost:${PORT}/health`);
  console.log(`   • Menu: http://localhost:${PORT}/api/menu`);
  console.log(`   • Menu Categories: http://localhost:${PORT}/api/menu/categories/list`);
  console.log(`   • Orders: http://localhost:${PORT}/api/orders`);
  console.log(`\n💡 Tip: Frontend should use GET /api/menu for complete menu data`);
  console.log(`=======================================\n`);
});