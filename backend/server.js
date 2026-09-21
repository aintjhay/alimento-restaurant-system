const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
require('./src/config/security').validateSecurity();

const { connectDB } = require('./src/config/mongodb');

const app = express();
const hops = Number(process.env.TRUST_PROXY_HOPS || 0);
if (!Number.isInteger(hops) || hops < 0 || hops > 5) throw new Error('TRUST_PROXY_HOPS must be 0 to 5.');
app.set('trust proxy', hops);

// Security & Performance Middleware
app.use(helmet());
app.use(compression());

// CORS Configuration
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean).concat([
  'http://localhost:3000',
  'http://localhost:5000',
  'https://alimento-resto.vercel.app',
  'https://alimento-restaurant-system.vercel.app'
]);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (for curl, Postman, mobile apps, etc)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowedOrigins or allow all in production
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Tracking-Token']
}));

// Body Parser Middleware - Increased limit for image uploads
app.use(express.json({ limit: '6mb', verify: (req, _res, buffer) => { if (req.originalUrl === '/api/payments/paymongo/webhook') req.rawBody = buffer.toString('utf8'); } }));
app.use(express.urlencoded({ limit: '6mb', extended: true }));

// Give periodic order-status reads their own budget so they cannot block menu or login requests.
const isOrderStatusRead = req => req.method === 'GET' && /^\/api\/orders\/[a-f0-9]{24}\/?(?:\?|$)/i.test(req.originalUrl);
const orderStatusLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Order updates are temporarily paused. Please try again shortly.' }
});
app.use((req, res, next) => isOrderStatusRead(req) ? orderStatusLimiter(req, res, next) : next());

// Rate Limiting
// Dashboard and kitchen polling must not exhaust the budget for admin changes.
const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many refresh requests. Please try again shortly.' }
});
app.use('/api/', (req, res, next) =>
  req.method === 'GET' && !isOrderStatusRead(req) ? readLimiter(req, res, next) : next());
const limiter = rateLimit({
  skip: req => req.method === 'GET',
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Import Routes
const menuRoutes = require('./src/routes/menuRoutes');
const orderRoutes = require('./src/routes/orderRoutes');
const forecastRoutes = require('./src/routes/forecastRoutes');
const userRoutes = require('./src/routes/userRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const authRoutes = require('./src/routes/authRoutes');
const inventoryRoutes = require('./src/routes/inventoryRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/forecast', forecastRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', require('./src/routes/storeRoutes'));
app.use('/api/admin/inventory', require('./src/middleware/authMiddleware').authMiddleware, require('./src/middleware/authMiddleware').requireRole('admin'), inventoryRoutes);
app.use('/api/payments', paymentRoutes);

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
        paginated: 'GET /api/menu?page=1'
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
  res.status(dbStatus === 'connected' ? 200 : 503).json({
    status: dbStatus === 'connected' ? 'healthy' : 'unavailable',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
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

async function start() {
  await connectDB();
  const hello = await require('mongoose').connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== 'isdbgrid') throw new Error('MongoDB must be a replica set or sharded cluster for order/payment transactions.');
  await Promise.all(['Order', 'Payment', 'StockMovement', 'Counter', 'CheckoutAttempt', 'Review'].map(name => require('./src/models/' + name).init()));
  return app.listen(process.env.PORT || 5000, () => console.log('Alimento API ready'));
}
if (require.main === module) start().then(server => {
  const close = () => server.close(() => require('mongoose').disconnect().then(() => process.exit(0)));
  process.on('SIGTERM', close); process.on('SIGINT', close);
}).catch(error => { console.error(error.message); process.exit(1); });
module.exports = { app, start };
