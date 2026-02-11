# ⚡ QUICK START - PORTAL AUTH TESTING

**What you just got:** Full Guest/Login portal checkout flow  
**Time to test:** 10 minutes  
**Status:** Ready to test right now!

---

## 🚀 START HERE (Copy-Paste Commands)

### **Step 1: Start Your Frontend** 
```bash
cd frontend
npm start
```
Wait for: `Compiled successfully! You can now view alimento in the browser.`

### **Step 2: Open Portal**
```
http://localhost:3000/portal
```

### **Step 3: Test Guest Flow**
1. Add ANY item to cart
2. Click **"Checkout"** button (bottom right)
3. Choose **"Continue as Guest"**
4. Fill form:
   - Name: `Test Guest`
   - Phone: `09123456789`
   - Address: `123 Main Street`
5. Payment: Select **Cash on Delivery**
6. Click **"Place order"**
7. Should see confirmation page ✅

### **Step 4: Test Login Flow**
1. Go back to http://localhost:3000/portal
2. Add items again
3. Click **"Checkout"**
4. Choose **"Login or Register"**
5. Click **"Register"** tab
6. Fill:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Password: `test123`
   - Confirm: `test123`
7. Click **"Create Account"**
8. Should redirect to checkout (Name/Email pre-filled!)
9. Fill phone and address
10. Choose payment and submit ✅

### **Step 5: Test Logout**
1. After successful order, check **header**
2. Should see: **"Welcome, John Doe!"**
3. Click **"Logout"** button
4. Header should clear
5. Message gone ✅

---

## 📱 TEST ON MOBILE

Open browser DevTools (F12):
- Click device icon (top left)
- Choose "iPhone 12" preset
- Test checkout flow on "mobile"

Should work smoothly on small screen! ✅

---

## 🔍 WHAT TO LOOK FOR

✅ **Checkout Choice Page**
- Two cards: Guest and Login
- Clicking either takes you to correct flow
- Responsive on mobile

✅ **Guest Checkout**
- Can fill name, phone, address
- Can choose Cash or GCash
- Can place order without login

✅ **Login/Register**
- Two tabs: Login and Register
- Tab switching works smoothly
- Form validation (email format, password length)
- Creates account and pre-fills checkout

✅ **Header Updates**
- After login, shows user name
- Logout button appears
- Logout clears everything

✅ **Payment Options**
- Cash: Simple, no upload
- GCash: Shows file upload when selected

---

## ❌ COMMON ISSUES & FIXES

**Issue:** "Button doesn't work or slow"
- Check: Is frontend running? (`npm start` running?)
- Fix: `npm start` in frontend folder

**Issue:** "Form fields blank after login"
- Check: Did you complete registration and redirect?
- Fix: Go to `/portal/login` → Register → Should redirect to checkout

**Issue:** "Not seeing 'Welcome' message"
- Check: Did you log in?
- Fix: Try logout button not showing? Refresh page (Ctrl+R)

**Issue:** "Upload button not showing for GCash"
- Check: Did you select GCash radio button?
- Fix: Click the radio button for GCash, not just label

---

## 📸 WHAT YOU'LL SEE

### **Checkout Choice Page:**
```
╔═══════════════════════════════╗
║  Choose Checkout Method       ║
║  Select how you'd like to...  ║
╠═════════════╦═════════════════╣
║  👤 Guest   ║  👨‍💼 Login/Reg  ║
║  One-time   ║  Save profile   ║
║  No account ║  ✓ Quick        ║
║  ✓ Quick    ║  ✓ Track orders ║
║             ║                 ║
║ [Continue]  ║  [Continue]     ║
╚═════════════╩═════════════════╝
```

### **Welcome Message (After Login):**
```
Header shows: "Welcome, John Doe!" [Logout]
```

---

## 📋 QUICK CHECKLIST

- [ ] Frontend starts without errors
- [ ] Portal home loads: http://localhost:3000/portal
- [ ] Add item to cart
- [ ] Checkout button appears (bottom right)
- [ ] Checkout choice page shows 2 cards
- [ ] Guest flow works (fills name/phone/address)
- [ ] Register flow works (creates account)
- [ ] After login, name shows in header
- [ ] Logout button works
- [ ] Payment method toggle works
- [ ] Can submit order without errors
- [ ] No console errors (F12 → Console)

---

## 🎯 NEXT (After Testing Works)

Once you confirm it works, move to:

**PRIORITY #1 (Today):** Database Connection & Order Saving
- Check if orders actually save to DB
- Test POST /api/orders endpoint
- See orders in Dashboard

**PRIORITY #2 (Tomorrow):** Portal → POS Sync
- Portal order appears in POS queue
- Real-time updates

**PRIORITY #3 (Thursday):** Admin Login
- Actual user authentication
- Admin menu management

---

**Time to complete this test:** 10-15 minutes max  
**Report back when:** You see the checkout choice page OR hit an error

Good luck! 🚀
