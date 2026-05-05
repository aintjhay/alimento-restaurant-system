# Inventory System Setup Checklist

## ✅ Pre-Installation

- [ ] Node.js and npm installed
- [ ] MongoDB running locally or connection string configured
- [ ] Backend and frontend directories exist
- [ ] `.env` file configured in backend with MongoDB connection

## ✅ Backend Setup

### Installation
- [ ] Navigate to `backend` directory
- [ ] Run `npm install`
- [ ] Verify all dependencies installed successfully

### Database
- [ ] MongoDB connection verified
- [ ] Run `node seedInventory.js` to populate inventory data
- [ ] Verify seed completed successfully (should show ~80 items)
- [ ] Check MongoDB to confirm Inventory collection created

### Server
- [ ] Run `npm run dev` or `npm start`
- [ ] Verify backend running on `http://localhost:5000`
- [ ] Test health endpoint: `http://localhost:5000/health`
- [ ] Test inventory endpoint: `http://localhost:5000/api/inventory`

### API Routes
- [ ] `GET /api/inventory` - Returns all items
- [ ] `GET /api/inventory/category/Carbs` - Returns category items
- [ ] `GET /api/inventory/alerts/low-stock` - Returns low stock items
- [ ] `GET /api/inventory/summary/overview` - Returns summary data

## ✅ Frontend Setup

### Installation
- [ ] Navigate to `frontend` directory
- [ ] Run `npm install`
- [ ] Verify all dependencies installed successfully

### Configuration
- [ ] Check `src/config/api.js` for correct API_BASE_URL
- [ ] Verify API_BASE_URL points to `http://localhost:5000`

### Component Files
- [ ] `frontend/src/pages/inventory/InventoryManagement.js` exists
- [ ] `frontend/src/pages/inventory/InventoryManagement.css` exists
- [ ] `frontend/src/App.js` includes InventoryManagement import
- [ ] `frontend/src/App.js` includes `/inventory` route

### Server
- [ ] Run `npm start`
- [ ] Verify frontend running on `http://localhost:3000`
- [ ] No console errors on startup

## ✅ Integration Testing

### Navigation
- [ ] Can access `/inventory` route
- [ ] Page loads without errors
- [ ] All UI elements visible

### Data Loading
- [ ] Inventory items load from backend
- [ ] Summary cards show correct data
- [ ] Table displays all items
- [ ] Categories filter works

### Functionality
- [ ] Search functionality works
- [ ] Category filter works
- [ ] Add item modal opens
- [ ] Edit item modal opens
- [ ] Delete confirmation appears
- [ ] Stock +/- buttons work
- [ ] Export CSV downloads file

### Real-time Features
- [ ] Low stock alerts display
- [ ] Status indicators show correctly
- [ ] Page auto-refreshes every 30 seconds
- [ ] Manual refresh button works

## ✅ Data Verification

### Inventory Items
- [ ] ~80 items loaded from seed
- [ ] All 7 categories represented
- [ ] Daily items present (Carbs, Meat, Fresh, Sauces)
- [ ] Weekly items present (Flour, Rice, Eggs, etc.)
- [ ] Every Other Week items present (Seasonings, Sauces)

### Stock Status
- [ ] Some items show 🟢 Good status
- [ ] Some items show 🟡 Warning status
- [ ] Some items show 🔴 Low status
- [ ] Low stock count matches alert box

### Summary Data
- [ ] Total Items count correct
- [ ] Low Stock count correct
- [ ] Total Value calculated correctly
- [ ] Category breakdown shows all categories

## ✅ Performance Testing

### Load Time
- [ ] Page loads in < 3 seconds
- [ ] Table renders smoothly
- [ ] No lag when scrolling
- [ ] Search responds quickly

### Data Operations
- [ ] Add item completes in < 2 seconds
- [ ] Edit item completes in < 2 seconds
- [ ] Delete item completes in < 2 seconds
- [ ] Stock update completes in < 1 second

### Export
- [ ] CSV export completes in < 5 seconds
- [ ] File downloads to correct location
- [ ] CSV opens correctly in Excel/Sheets

## ✅ Browser Compatibility

- [ ] Chrome/Chromium works
- [ ] Firefox works
- [ ] Safari works (if on Mac)
- [ ] Edge works (if on Windows)
- [ ] Mobile browser works (responsive)

## ✅ Error Handling

### Network Errors
- [ ] Graceful handling if backend offline
- [ ] Error messages display clearly
- [ ] Retry functionality works

### Validation
- [ ] Required fields validated
- [ ] Invalid input rejected
- [ ] Error messages helpful

### Edge Cases
- [ ] Empty inventory handled
- [ ] Large datasets handled
- [ ] Special characters in names handled
- [ ] Decimal quantities handled

## ✅ Security

- [ ] Authentication required for access
- [ ] Cannot access without login
- [ ] Session persists correctly
- [ ] Logout clears session

## ✅ Documentation

- [ ] `INVENTORY_SYSTEM_README.md` created
- [ ] `INVENTORY_QUICK_START.md` created
- [ ] `INVENTORY_SETUP_CHECKLIST.md` created
- [ ] API documentation complete
- [ ] Code comments present

## ✅ Deployment Preparation

### Code Quality
- [ ] No console errors
- [ ] No console warnings
- [ ] Code follows project style
- [ ] No unused imports

### Database
- [ ] Indexes created for performance
- [ ] Backup of seed data available
- [ ] Connection string secure

### Environment
- [ ] `.env` file configured
- [ ] API endpoints correct
- [ ] CORS configured properly
- [ ] Rate limiting configured

## ✅ User Training

- [ ] Team trained on basic operations
- [ ] Team trained on daily workflow
- [ ] Team trained on troubleshooting
- [ ] Documentation provided to team
- [ ] Support contact information shared

## ✅ Go-Live Checklist

- [ ] All tests passed
- [ ] Documentation complete
- [ ] Team trained
- [ ] Backup system in place
- [ ] Monitoring set up
- [ ] Support plan ready

## 📋 Post-Launch

- [ ] Monitor system performance
- [ ] Collect user feedback
- [ ] Fix any issues
- [ ] Plan enhancements
- [ ] Schedule regular backups
- [ ] Review usage patterns

---

## 🚨 Troubleshooting During Setup

### Backend Won't Start
```bash
# Check if port 5000 is in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process if needed
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows
```

### Frontend Won't Connect to Backend
```bash
# Check API_BASE_URL in src/config/api.js
# Should be: http://localhost:5000

# Check CORS settings in backend/server.js
# Should allow localhost:3000
```

### Database Connection Failed
```bash
# Check MongoDB is running
# Check connection string in .env
# Verify database name is correct
```

### Seed Script Fails
```bash
# Check MongoDB connection
# Check Inventory model exists
# Check seed data format
# Run with verbose logging: node seedInventory.js
```

### Items Not Showing in Frontend
```bash
# Check backend is running
# Check API endpoint returns data
# Check browser console for errors
# Check network tab in DevTools
```

---

## 📞 Support Resources

- **Backend Issues** - Check `backend/server.js` logs
- **Frontend Issues** - Check browser console (F12)
- **Database Issues** - Check MongoDB logs
- **API Issues** - Test with Postman or curl
- **Documentation** - See `INVENTORY_SYSTEM_README.md`

---

## ✨ Success Indicators

✅ All items above checked  
✅ System running smoothly  
✅ Team trained and ready  
✅ Documentation complete  
✅ Backups in place  

**You're ready to go live! 🚀**

---

**Last Updated:** May 2026
**System:** Alimento Inventory Management System
