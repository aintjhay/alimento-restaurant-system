# 🍽️ ALIMENTO Restaurant Management System - Complete Documentation

**Version:** 2.0 (Feb 2026)  
**Status:** Production Ready with Advanced Features

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [System Architecture](#system-architecture)
4. [Installation Guide](#installation-guide)
5. [API Documentation](#api-documentation)
6. [Frontend Features](#frontend-features)
7. [Database Schema](#database-schema)
8. [Configuration Guide](#configuration-guide)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

ALIMENTO is a comprehensive restaurant management and demand forecasting system built with modern web technologies. It provides real-time order management, advanced demand forecasting using Prophet ML, and detailed analytics with export capabilities.

### Technology Stack

**Backend:**
- Node.js + Express.js
- MongoDB (Real Database)
- Mongoose ODM
- Prophet for ML Forecasting
- jsPDF & json2csv for Report Generation

**Frontend:**
- React 19.2.4
- Chart.js for Data Visualization
- Axios for API Communication
- Framer Motion for Animations
- React Router for Navigation

---

## Key Features

### ✨ Phase 1: Core Features (✅ Completed)
- ✅ Menu Management with Modifiers & Addons
- ✅ Real-time Order Processing
- ✅ Multi-type Orders (Dine-in, Takeaway, Delivery)
- ✅ Payment Status Tracking
- ✅ Order Status Workflow (pending → preparing → ready → served → completed)

### 🚀 Phase 2: Analytics & Forecasting (✅ Completed)
- ✅ Demand Forecasting with Prophet ML
- ✅ Historical Data Analysis
- ✅ Accuracy Metrics (MAE, RMSE, MAPE)
- ✅ Category-based Forecasting
- ✅ Day-of-Week Trend Analysis

### 📊 Phase 3: Advanced Dashboard (✅ Completed)
- ✅ Interactive Charts (Line, Bar, Pie, Doughnut)
- ✅ Real-time Statistics
- ✅ Top Items Analysis
- ✅ Revenue Tracking
- ✅ Export to CSV & PDF
- ✅ Responsive Design (Mobile, Tablet, Desktop)

### 📱 Phase 4: Performance & Security (✅ Completed)
- ✅ Rate Limiting (100 requests/15 minutes)
- ✅ Helmet Security Headers
- ✅ CORS Configuration
- ✅ Data Compression (GZIP)
- ✅ Error Handling & Logging

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                      │
│  Dashboard | POS | Orders | Analytics | Reporting        │
└─────────────────────────────────────────────────────────┘
                           ↕ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│                  API Gateway (Express)                    │
│  Authentication | Rate Limiting | CORS | Compression    │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  Business Logic Layer                     │
│  Routes | Controllers | Services | Utilities             │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                  Data Layer (MongoDB)                     │
│  Orders | Menu Items | Forecasts | Users                 │
└─────────────────────────────────────────────────────────┘
```

---

## Installation Guide

### Prerequisites
- Node.js >= 14.0
- MongoDB >= 4.4
- npm or yarn
- Python 3.7+ (for Prophet forecasting)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Configure environment variables
nano .env
```

**.env Configuration:**
```
MONGODB_URI=mongodb://localhost:27017/alimento
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

```bash
# 5. Seed database with initial data
npm run seed

# 6. Start development server
npm run dev

# Or start production server
npm start
```

### Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start
```

The frontend will open at `http://localhost:3000`

---

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
Currently, the API operates without authentication. Add authentication middleware for production.

### Rate Limiting
- **Limit:** 100 requests per 15 minutes
- **Headers:** Returns `X-RateLimit-*` headers

### Common Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error information"
}
```

### Menu Endpoints

#### Get All Menu Items
```
GET /menu
Response: Array of menu items with modifiers and addons
```

#### Get Menu by Category
```
GET /menu/category/:category
Params:
  - category: Category name (Cocktails, Pasta, etc.)
```

#### Get All Categories
```
GET /menu/categories/list
Response: Array of all available categories
```

#### Get Complete Menu Data
```
GET /menu/complete
Response: Full menu with all details
```

### Order Endpoints

#### Create Order
```
POST /orders
Body:
{
  "tableNumber": "1",
  "orderType": "Dine-in",
  "customerName": "John Doe",
  "items": [
    {
      "menuItemId": "ObjectId",
      "name": "Cocktail Name",
      "price": 120,
      "quantity": 2,
      "modifiers": [],
      "addons": []
    }
  ],
  "subtotal": 240,
  "taxAmount": 36,
  "totalAmount": 276
}
```

#### Get All Orders
```
GET /orders?limit=50&status=completed&startDate=2026-02-01&endDate=2026-02-16
Query Params:
  - limit: Number of orders to return (default: 50)
  - status: Filter by status (pending, preparing, ready, served, completed)
  - startDate: ISO date format
  - endDate: ISO date format
```

#### Get Today's Orders
```
GET /orders/today
Response: Orders placed today with statistics
```

#### Get Top Items
```
GET /orders/top-items?limit=10
Response: Most ordered items with counts
```

#### Update Order Status
```
PATCH /orders/:id/status
Body:
{
  "status": "preparing",
  "paymentStatus": "paid"
}
```

#### Export Orders to CSV
```
GET /orders/export/csv?startDate=2026-02-01&endDate=2026-02-16
Response: CSV file download
```

#### Export Orders to PDF
```
GET /orders/export/pdf?status=completed
Response: PDF file download
```

#### Export Sales Summary
```
GET /orders/export/summary/csv?period=day&startDate=2026-02-01
Query Params:
  - period: day, week, month
  - startDate, endDate: Optional date range
```

### Forecast Endpoints

#### Generate Forecast
```
GET /forecast?days=30&historical=90
Query Params:
  - days: Forecast days (1-90)
  - historical: Historical data days (7-365)

Response:
{
  "status": "success",
  "forecast": [
    {
      "ds": "2026-02-17",
      "yhat": 65.5,
      "yhat_lower": 50.2,
      "yhat_upper": 80.8
    }
  ],
  "insights": [...],
  "accuracy": 0.87
}
```

#### Get Data Statistics
```
GET /forecast/data-stats?days=90
Response: Statistical analysis of historical orders
```

#### Get Latest Forecast
```
GET /forecast/latest
Response: Most recent forecast stored in database
```

#### Export Forecast to PDF
```
GET /forecast/export/pdf
Response: PDF report with forecast details
```

#### Export Forecast to CSV
```
GET /forecast/export/csv
Response: CSV file with predictions
```

### Health Check
```
GET /health
Response:
{
  "status": "healthy",
  "database": "connected",
  "uptime": 3600,
  "environment": "development"
}
```

---

## Frontend Features

### 1. Dashboard Component
- Real-time statistics (Total Orders, Revenue, Avg Order Value)
- Interactive charts with multiple views
- Time range selection (7 days, 30 days, 1 year)
- Export functionality
- Responsive layout

### 2. Enhanced Admin Dashboard
- Advanced analytics visualizations
- Top items by revenue
- Order distribution by type and category
- Sales trends with historical data
- Export to CSV/PDF

### 3. Export Modal
- Format selection (CSV/PDF)
- Date range filtering
- Status filtering (for orders)
- Preview information
- Download management

### 4. Multiple Chart Types
- **LineChart:** Trends and time series data
- **BarChart:** Comparisons and distributions
- **PieChart:** Category breakdown
- **DoughnutChart:** Circular distributions

### 5. Responsive Design
- Mobile-first approach
- Breakpoints: 480px, 768px, 1024px, 1200px
- Touch-friendly interfaces
- Adaptive layouts

---

## Database Schema

### MenuItem Collection
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  image: String,
  modifiers: [
    {
      name: String,
      required: Boolean,
      options: [{ name: String, price: Number }]
    }
  ],
  addons: [{ name: String, price: Number }],
  isAvailable: Boolean,
  preparationTime: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Collection
```javascript
{
  orderNumber: String,
  tableNumber: String,
  orderType: String, // Dine-in, Takeaway, Delivery
  customerName: String,
  items: [
    {
      menuItemId: ObjectId,
      name: String,
      price: Number,
      quantity: Number,
      modifiers: [...],
      addons: [...],
      itemTotal: Number
    }
  ],
  subtotal: Number,
  taxAmount: Number,
  discount: Number,
  totalAmount: Number,
  status: String, // pending, preparing, ready, served, completed
  paymentStatus: String, // unpaid, paid, etc.
  createdAt: Date,
  updatedAt: Date
}
```

### Forecast Collection
```javascript
{
  generatedAt: Date,
  forecastDays: Number,
  historicalDays: Number,
  modelType: String,
  predictions: [
    {
      ds: String, // YYYY-MM-DD
      yhat: Number,
      yhat_lower: Number,
      yhat_upper: Number
    }
  ],
  accuracy: Number,
  insights: [
    {
      type: String,
      message: String,
      recommendation: String
    }
  ],
  confidence: Number
}
```

---

## Configuration Guide

### Security Configuration

**CORS Setup (backend/server.js):**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}));
```

**Helmet Security Headers:**
```javascript
app.use(helmet()); // Adds security headers automatically
```

**Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requests per window
});
app.use('/api/', limiter);
```

### Database Configuration

**Connection String Format:**
```
MongoDB Atlas: mongodb+srv://user:password@cluster.mongodb.net/database
Local MongoDB: mongodb://localhost:27017/alimento
```

**Connection Retry Logic:**
- Retries: 5 attempts
- Timeout: 5 seconds
- Pool size: 5 connections

---

## Deployment Guide

### Heroku Deployment

```bash
# 1. Create Heroku app
heroku create alimento-app

# 2. Set environment variables
heroku config:set MONGODB_URI=mongodb+srv://...
heroku config:set NODE_ENV=production

# 3. Deploy
git push heroku main

# 4. View logs
heroku logs --tail
```

### Docker Deployment

**Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

**Build & Run:**
```bash
docker build -t alimento-app .
docker run -p 5000:5000 -e MONGODB_URI=mongodb://... alimento-app
```

### Production Checklist

- ✅ Set NODE_ENV=production
- ✅ Configure HTTPS/SSL
- ✅ Enable database backups
- ✅ Set up monitoring (New Relic, Datadog)
- ✅ Configure CDN for static assets
- ✅ Set up CI/CD pipeline
- ✅ Enable rate limiting
- ✅ Configure CORS for production domain
- ✅ Set up error tracking (Sentry)
- ✅ Enable HTTP/2

---

## Troubleshooting

### Common Issues

**Issue: MongoDB Connection Failed**
```
Solution:
1. Verify MongoDB is running: mongod
2. Check connection string in .env
3. Verify network access (if using Atlas)
4. Check firewall settings
```

**Issue: Port 5000 Already in Use**
```bash
# Find and kill process on port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

**Issue: Charts Not Displaying**
```
Solution:
1. Verify Chart.js is installed: npm list chart.js
2. Check React-ChartJS-2: npm list react-chartjs-2
3. Verify data format matches chart type
4. Check browser console for errors
```

**Issue: Export Not Working**
```
Solution:
1. Check CORS configuration
2. Verify export libraries are installed
3. Check file permissions
4. Review error logs
```

**Issue: Slow Forecast Generation**
```
Solution:
1. Increase historical data window
2. Optimize MongoDB queries with indexes
3. Use clustering for Node.js
4. Implement caching layer (Redis)
```

### Performance Optimization

1. **Database Indexing:**
   ```javascript
   db.orders.createIndex({ "createdAt": -1 })
   db.orders.createIndex({ "status": 1 })
   ```

2. **Query Optimization:**
   - Use `.lean()` for read-only queries
   - Implement pagination
   - Use select() to limit fields

3. **Caching:**
   - Implement Redis for frequently accessed data
   - Cache menu items (rarely change)
   - Cache forecast results

4. **Frontend Optimization:**
   - Code split with React.lazy()
   - Optimize images
   - Enable compression
   - Use CDN for static assets

---

## Support & Contact

For issues, feature requests, or support:
- Email: support@alimento-system.com
- GitHub: [alimento-capstone](https://github.com/example/alimento)
- Documentation: [Full Docs](https://alimento-docs.example.com)

---

**Last Updated:** February 16, 2026  
**Next Review:** March 16, 2026
