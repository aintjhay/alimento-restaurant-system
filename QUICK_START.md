# 🚀 ALIMENTO Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js installed
- MongoDB installed locally (or MongoDB Atlas account)
- Terminal/Command Prompt

### Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Configure MongoDB connection
# Edit .env file with your MongoDB URI
MONGODB_URI=mongodb://localhost:27017/alimento

# Seed database with sample data
npm run seed

# Start server
npm start
```

✅ Backend running at `http://localhost:5000`

###  Frontend Setup

```bash
# In a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

✅ Frontend running at `http://localhost:3000`

---

## Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/menu` | Get all menu items |
| GET | `/api/orders` | Get all orders |
| POST | `/api/orders` | Create new order |
| GET | `/api/forecast` | Generate demand forecast |
| GET | `/api/orders/export/csv` | Export orders as CSV |
| GET | `/api/orders/export/pdf` | Export orders as PDF |
| GET | `/health` | Check system health |

---

## Features Overview

### 📊 Dashboard
- View real-time statistics
- Interactive charts
- Export data to CSV/PDF

### 📦 Order Management
- Create orders with modifiers/addons
- Track order status
- Process payments

### 📈 Forecasting
- AI-powered demand forecasting
- Accuracy metrics
- Category trends

### 📱 Responsive Design
- Works on desktop, tablet, mobile
- Touch-friendly interface
- Offline-ready

---

## Troubleshooting

**MongoDB Connection Error:**
```
Check if MongoDB is running: mongod
Or update .env with your MongoDB Atlas connection string
```

**Port Already in Use:**
```bash
# Change PORT in .env
PORT=5001

# Or kill process on port 5000
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000 | kill -9
```

**Frontend Won't Connect to Backend:**
```
Verify FRONTEND_URL in backend .env matches frontend URL
Default: http://localhost:3000
```

---

## Next Steps

1. **Customize Menu:** Add your restaurant's menu items
2. **Configure Forecasting:** Adjust forecast parameters
3. **Set Up Authentication:** Add user authentication
4. **Deploy to Cloud:** Use Heroku, AWS, or similar
5. **Enable Payment Gateway:** Integrate Stripe/GCash

---

## Useful Commands

```bash
# Backend
npm start          # Production server
npm run dev        # Development with auto-reload
npm run seed       # Populate database

# Frontend
npm start          # Development server
npm run build      # Create production build
npm test           # Run tests

# Database
# Connect to MongoDB CLI
mongosh "mongodb://localhost:27017/alimento"

# View collections
show collections

# Get order count
db.orders.countDocuments()
```

---

**Version:** 2.0  
**Updated:** Feb 16, 2026
