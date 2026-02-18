# 🚀 ALIMENTO 60% COMPLETION - PRIORITY ACTION PLAN
**Created:** February 12, 2026  
**Deadline:** February 26, 2026 (13 days) - PRE-ORAL  
**Current Status:** 45% → Target: 60%

---

## 🎯 RECOMMENDED PRIORITY ORDER

### **TIER 1 - TODAY (FEB 12) - FOUNDATION** 🔴

#### **#1 FIX DATABASE CONNECTION (DO THIS FIRST)**
- **File:** `backend/src/config/database.js`
- **Issue:** Backend can't save to MongoDB
- **Impact:** Everything else depends on this
- **Time:** 30 mins
- **Test:** Run `node backend/server-dev.js` and check `/health` endpoint

```
Task Checklist:
[ ] Verify MongoDB is running locally
[ ] Check MONGODB_URI in backend/.env
[ ] Test connection with health check
[ ] Can create new menu items in DB
[ ] Can create orders in DB
```

---

#### **#2 TEST & FIX ORDER API SAVING (Portal & POS)**
- **Files:** 
  - `backend/src/routes/orderRoutes.js` (POST /api/orders)
  - `frontend/src/services/api.js` (ordersAPI.create)
- **Issue:** Orders created but not saved to DB
- **Impact:** Portal checkout and POS submit both broken
- **Time:** 1 hour
- **Test:** Place test order from Portal, check if it appears in Dashboard

```
Task Checklist:
[ ] POST /api/orders endpoint working
[ ] Order saved with all fields
[ ] Order appears in GET /api/orders
[ ] OrderNumber auto-generated
[ ] timestamps recorded
```

---

### **TIER 2 - THURSDAY (FEB 13) - INTEGRATION** 🟡

#### **#3 PORTAL → POS ORDER SYNC**
- **Files:**
  - `frontend/src/pages/pos/PosSystem.js` (fetch live orders)
  - `frontend/src/pages/dashboard/Dashboard.js` (refresh orders)
- **Issue:** Portal orders don't appear in POS queue
- **Impact:** Portal orders go nowhere
- **Time:** 1 hour
- **Test:** Place Portal order → appears in POS within seconds

```
Task Checklist:
[ ] POS fetches orders from /api/orders on load
[ ] Portal order appears in POS queue
[ ] Real-time refresh (5-10 second interval)
[ ] Order details show correct info
```

---

#### **#4 ADMIN AUTHENTICATION (LOGIN/LOGOUT)**
- **Files:**
  - `frontend/src/pages/auth/Login.js` (validate against DB)
  - `frontend/src/App.js` (check auth state)
  - `backend/src/models/User.js` (create if missing)
- **Issue:** Anyone can log in with any credentials
- **Impact:** Admin dashboard not secure
- **Time:** 1 hour
- **Test:** Try login with wrong password → rejected

```
Task Checklist:
[ ] User model in backend
[ ] Seed admin user to DB
[ ] Login validates credentials
[ ] Session/token persists
[ ] Protected routes work
```

---

#### **#5 PORTAL AUTH & LOGOUT** 
- **Files:**
  - `frontend/src/components/portal/PortalHeader.js` (add logout button)
  - `frontend/src/pages/portal/PortalHome.js` (check customer login)
- **Issue:** Portal has no login/logout (mentioned in request)
- **Impact:** Customer tracking broken
- **Time:** 30 mins
- **Test:** Can enter name/email → logout returns to home

```
Task Checklist:
[ ] Portal asks for customer info at checkout
[ ] Store customer session
[ ] Show "Welcome, [Name]" in header
[ ] Logout button works
[ ] Cart clears on logout (optional: keeps cart)
```

---

### **TIER 3 - FRIDAY (FEB 14) - ADMIN FEATURES** 🟢

#### **#6 ADMIN MENU MANAGEMENT**
- **Files:** `frontend/src/pages/dashboard/Dashboard.js`
- **Issue:** Can't add/edit/delete menu items in admin
- **Impact:** Menu management broken
- **Time:** 1.5 hours
- **Test:** Add new item → appears in Portal menu

---

#### **#7 ADMIN ORDER STATUS UPDATES**
- **Files:** `frontend/src/pages/dashboard/Dashboard.js`
- **Issue:** Can't mark orders as preparing/ready/completed
- **Impact:** Can't manage order workflow
- **Time:** 1 hour
- **Test:** Change order status → POS updates in real-time

---

### **TIER 4 - WEEKEND (FEB 15-16) - POLISH** ✨

#### **#8 DASHBOARD METRICS**
- Real sales data
- Today's revenue
- Top selling items

#### **#9 RECEIPT PRINTING**
- Thermal printer simulation
- Print preview

#### **#10 FINAL TESTING**
- End-to-end Portal order flow
- Demo scenario practice

---

## 📅 DAILY BREAKDOWN

### **TODAY (WEDNESDAY, FEB 12) - 4 HOURS**
```
14:00 - 14:30  FIX #1: Database Connection
14:30 - 15:30  FIX #2: Order API Saving
15:30 - 16:00  TEST: Portal order saves to DB
16:00 - 17:00  FIX #4: Admin Login (if time)

GOAL: Portal and POS can save orders to database
```

### **THURSDAY (FEB 13) - 4 HOURS**
```
Morning  FIX #3: Portal → POS Sync
Midday   FIX #4: Complete Admin Login
Afternoon FIX #5: Portal Login/Logout
Evening  TEST: Complete order flow works

GOAL: Orders sync between Portal and POS
```

### **FRIDAY (FEB 14) - 4 HOURS**
```
Morning  FIX #6: Admin Menu CRUD
Midday   FIX #7: Admin Order Status
Afternoon TEST: Full admin dashboard
Evening  TESTING: Demo scenario

GOAL: Admin can manage everything
```

### **SATURDAY-SUNDAY (FEB 15-16) - 6 HOURS**
```
Morning  FIX #8: Dashboard Metrics
Midday   FIX #9: Receipt Printing
Afternoon TESTING: End-to-end
Evening  FINAL CHECKS

GOAL: 60% SUBMISSION READY
```

---

## 🔧 WHAT TO START WITH RIGHT NOW (IN ORDER)

### **STEP 1: Check Database Connection**
Run in terminal:
```bash
cd backend
node server-dev.js
```
Look for this in output:
```
✅ Connected to MongoDB
```

If you see this instead:
```
MongoDB connection error
```

Then FIX #1 is your first task.

---

### **STEP 2: Check Order API**
Test with Postman or curl:
```bash
POST http://localhost:5000/api/orders
Body (JSON):
{
  "tableNumber": "1",
  "customerName": "Test",
  "orderType": "Dine-in",
  "items": [
    {
      "menuItemId": "1",
      "name": "CHORIZO",
      "price": 200,
      "quantity": 1
    }
  ],
  "totalAmount": 200,
  "status": "pending"
}
```

If you get a 201 response with order saved, FIX #2 is done.
If not, it needs fixing.

---

### **STEP 3: Check Portal Order Saving**
1. Go to Portal (http://localhost:3000/portal)
2. Add item to cart
3. Go to checkout
4. Fill in all fields
5. Click "Place Order"
6. Check Dashboard - should show the order

If order doesn't appear, FIX #2 needs more work.

---

## 📊 SUCCESS CRITERIA (60%)

✅ **MUST HAVE (NON-NEGOTIABLE):**
- [x] Admin Dashboard exists
- [ ] POS can take and save orders
- [ ] Portal can place and save orders
- [ ] Orders sync Portal → POS
- [ ] Database is actually connected
- [ ] Admin can log in
- [ ] Customer checkout works end-to-end
- [ ] Orders persist after page refresh

❌ **CAN SKIP (for 60%):**
- Receipt printing
- Email/SMS notifications
- GCash integration (simulate only)
- Inventory deduction
- Advanced analytics

---

## 🔑 KEY FILES TO FOCUS ON

```
BACKEND (API & Database):
├── backend/server.js (main server)
├── backend/src/config/database.js (MongoDB connection)
├── backend/src/routes/orderRoutes.js (save/get orders)
├── backend/src/routes/menuRoutes.js (menu API)
├── backend/src/models/Order.js (order schema)
└── backend/src/models/MenuItem.js (menu schema)

FRONTEND (User Interface):
├── frontend/src/pages/portal/PortalHome.js (menu browsing)
├── frontend/src/pages/portal/PortalCheckout.js (checkout - SAVE ORDER HERE)
├── frontend/src/pages/pos/PosSystem.js (cafe interface - FETCH ORDERS HERE)
├── frontend/src/pages/dashboard/Dashboard.js (admin - MANAGE ORDERS HERE)
├── frontend/src/pages/auth/Login.js (admin login - FIX AUTH HERE)
└── frontend/src/services/api.js (API calls - CHECK ENDPOINTS)
```

---

## ⚡ QUICK WINS (If you have 30 mins today)

1. **Check DB Connection** (5 mins)
2. **Test Order API** (10 mins)
3. **Identify blockers** (10 mins)
4. **Document findings** (5 mins)

---

## 📞 WHEN STUCK

**If database won't connect:**
- Check if MongoDB is running
- Check `.env` file has MONGODB_URI
- Check mongoose.connect() in server.js

**If orders don't save:**
- Check POST endpoint returns 201
- Check order model has all required fields
- Check API call in Portal/POS sends all data

**If Portal → POS sync not working:**
- Check POS fetches from /api/orders
- Check refresh interval is reasonable (5sec)
- Check order details match between systems

---

## 📋 SUBMIT CHECKLIST (60% Mark)

Before Feb 16, ensure:
- [ ] Database connected ✓
- [ ] Portal orders save ✓
- [ ] POS orders save ✓
- [ ] Portal → POS sync working ✓
- [ ] Admin can log in ✓
- [ ] Dashboard shows real orders ✓
- [ ] No console errors ✓
- [ ] Demo scenario works start-to-finish ✓

---

**FINAL RECOMMENDATION:** Start with FIX #1 (Database) today. It's the foundation everything else depends on. Once that's solid, everything else falls into place quickly.

**Time commitment:** ~15-20 hours over 4 days to hit 60%
