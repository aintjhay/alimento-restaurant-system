# 🚀 Backend Development Setup - WORKING

## ✅ Status: BACKEND IS NOW RUNNING

The backend server is **live and ready for development** at **http://localhost:5000** 

---

## 🎯 Quick Start

### Start Backend (Development Mode)
```bash
cd backend
node server-dev.js
```

**Output should show:**
```
🚀 Starting Alimento Restaurant API with IN-MEMORY MongoDB...
📦 MongoDB Memory Server created
✅ Connected to IN-MEMORY MongoDB
✅ Seeded 49 menu items
🎯 Server running on http://localhost:5000
```

### Stop Backend
Press `Ctrl+C` in the terminal where the server is running.

---

## 🔧 What's Running

- **Server**: Node.js Express API
- **Database**: MongoDB Memory Server (in-memory, no installation needed)
- **Port**: 5000
- **Auto-seeded**: 49 menu items from the complete menu
- **Data persistence**: None (resets on restart - good for development)

---

## 🧪 Test Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

### Get All Menu Items
```bash
curl http://localhost:5000/api/menu
```

### Get Orders
```bash
curl http://localhost:5000/api/orders
```

### Create an Order (POST)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"menuItemId": "507f1f77bcf86cd799439011", "quantity": 2}
    ],
    "tableNumber": 5
  }'
```

---

## 📡 Available API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API documentation |
| GET | `/health` | Health check |
| GET | `/api/menu` | All menu items |
| GET | `/api/menu/categories/list` | Menu categories |
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | All orders |
| GET | `/api/orders/today` | Today's orders |
| PATCH | `/api/orders/:id/status` | Update order status |

---

## 💾 Database Notes

- **In-Memory MongoDB**: Data doesn't persist between restarts
- **Perfect for**: Development, testing, feature building
- **Auto-seeds**: 49 complete menu items on startup
- **No setup needed**: MongoDB Memory Server handles everything

---

## 🔄 Development Workflow

1. **Terminal 1**: Start backend
   ```bash
   cd backend
   node server-dev.js
   ```

2. **Terminal 2**: Start frontend (when ready)
   ```bash
   cd frontend
   npm start
   ```

Frontend will be available at: http://localhost:3000

---

## ⚡ Production vs Development

| Aspect | Development | Production |
|--------|-------------|-----------|
| **Start command** | `node server-dev.js` | `npm start` |
| **Database** | In-Memory MongoDB | Real MongoDB |
| **Port** | 5000 | 5000 (configurable) |
| **Data Persistence** | None | Yes |
| **Seeding** | Automatic | Manual |

---

## 🐛 If Server Won't Start

### Port 5000 already in use
```bash
# Kill all Node processes (Windows PowerShell)
Get-Process node | Stop-Process -Force

# Then start again
cd backend
node server-dev.js
```

### Module errors
```bash
# Reinstall dependencies
cd backend
npm install
```

---

## 📝 Next Steps for Real Development

1. ✅ Backend is running - ready for API testing
2. Frontend integration ready to connect
3. Database seeded with 49 menu items
4. All core endpoints operational
5. Ready for feature building

Start the frontend in a new terminal when ready!

---

**Created**: February 25, 2026
**Status**: 🟢 ACTIVE & OPERATIONAL
