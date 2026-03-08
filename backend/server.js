const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./src/config/mongodb');

const app = express();

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'https://alimento-resto.vercel.app'
];

app.use(cors({
  origin: process.env.FRONTEND_URL ? 
    (origin) => {
      // If FRONTEND_URL is set to *, allow all
      if (process.env.FRONTEND_URL === '*') {
        return true;
      }
      // Otherwise validate against allowed origins
      if (!origin || allowedOrigins.includes(origin)) {
        return true;
      }
      // Also allow if starts with process.env.FRONTEND_URL
      if (process.env.FRONTEND_URL && origin?.includes(process.env.FRONTEND_URL)) {
        return true;
      }
      return false;
    }
    : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-seed-secret']
}));

// Body Parser Middleware - Increased limit for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

// Import Routes
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const forecastRoutes = require('./src/routes/forecastRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const authRoutes = require('./src/routes/authRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    message: 'Alimento Restaurant API',
    version: '1.0.0',
    database: 'MongoDB',
    environment: process.env.NODE_ENV || 'development',
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
        updateStatus: 'PATCH /api/orders/:id/status',
        export: 'GET /api/orders/export/csv'
      },
      forecast: {
        generate: 'POST /api/forecast/generate',
        latest: 'GET /api/forecast/latest',
        accuracy: 'GET /api/forecast/accuracy'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ 
    status: 'healthy',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// One-time seed endpoint (protected by secret key)
app.post('/api/seed', async (req, res) => {
  const secret = req.headers['x-seed-secret'];
  if (secret !== process.env.SEED_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const MenuItem = require('./src/models/MenuItem');
    const completeMenu = require('./src/data/completeMenu');
    await MenuItem.deleteMany({});
    const items = completeMenu.map(item => ({
      ...item,
      modifiers: item.modifiers || [],
      addons: item.addons || [],
      isAvailable: true,
      preparationTime: item.preparationTime || 15
    }));
    const inserted = await MenuItem.insertMany(items);
    res.json({ success: true, message: `Seeded ${inserted.length} menu items` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      home: 'GET /',
      health: 'GET /health',
      menu: 'GET /api/menu',
      orders: 'GET /api/orders'
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Alimento Restaurant API Started`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Database: MongoDB`);
  console.log(`🔒 Security: Helmet + Rate Limiting Enabled`);
  console.log(`\n📍 Available Endpoints:`);
  console.log(`   • Root: http://localhost:${PORT}/`);
  console.log(`   • Health: http://localhost:${PORT}/health`);
  console.log(`   • Menu: http://localhost:${PORT}/api/menu`);
  console.log(`   • Orders: http://localhost:${PORT}/api/orders`);
  console.log(`   • Forecast: http://localhost:${PORT}/api/forecast`);
  console.log(`${'='.repeat(50)}\n`);
});