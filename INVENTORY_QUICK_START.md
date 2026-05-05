# Inventory System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Seed the Database (First Time Only)
```bash
cd backend
node seedInventory.js
```
This loads all your restaurant's inventory items from the document.

### Step 2: Start the Backend
```bash
npm run dev
```
Backend will run on `http://localhost:5000`

### Step 3: Start the Frontend
```bash
cd frontend
npm start
```
Frontend will run on `http://localhost:3000`

### Step 4: Access Inventory
1. Go to `http://localhost:3000/inventory`
2. You'll see all inventory items organized by category

---

## 📋 Common Tasks

### ✅ Check Low Stock Items
1. Look at the "Low Stock Alert" box at the top
2. Items with 🔴 status in the table are low
3. Click on any category to filter

### ✅ Add Stock
1. Find the item in the table
2. Click the **+** button next to the quantity
3. Enter how many to add
4. Done! Stock updates instantly

### ✅ Remove Stock
1. Find the item in the table
2. Click the **−** button next to the quantity
3. Enter how many to remove
4. Done!

### ✅ Add New Item
1. Click **"Add Item"** button (top right)
2. Fill in:
   - Item Name (required)
   - Category (required)
   - Unit (required)
   - Current Stock (required)
   - Minimum Threshold (required)
3. Click **"Save Item"**

### ✅ Edit Item Details
1. Click the **pencil icon** in the Actions column
2. Update any fields
3. Click **"Save Item"**

### ✅ Delete Item
1. Click the **trash icon** in the Actions column
2. Confirm deletion
3. Item is removed

### ✅ Export Inventory
1. Click **"Export CSV"** button
2. File downloads automatically
3. Open in Excel or Google Sheets

### ✅ Search for Items
1. Type in the search box (top)
2. Search by: name, supplier, or location
3. Results filter automatically

### ✅ Filter by Category
1. Click any category button
2. Table shows only that category
3. Click "All" to see everything

---

## 📊 Understanding the Dashboard

### Summary Cards (Top)
- **Total Items** - How many items you're tracking
- **Low Stock** - Items below minimum threshold
- **Total Value** - Total cost of all inventory

### Status Indicators
- 🟢 **Good** - Plenty of stock
- 🟡 **Warning** - Getting low
- 🔴 **Low** - Need to reorder NOW

### Table Columns
| Column | What It Shows |
|--------|---------------|
| Item Name | Product name |
| Category | Type of item |
| Current Stock | How much you have |
| Unit | Measurement (PCS, KG, etc.) |
| Min. Threshold | When to reorder |
| Unit Cost | Price per unit |
| Total Value | Current Stock × Unit Cost |
| Supplier | Where you buy it |
| Location | Where it's stored |
| Status | 🟢/🟡/🔴 indicator |
| Actions | Edit/Delete buttons |

---

## 🎯 Daily Workflow

### Morning (Start of Day)
1. Open Inventory page
2. Check "Low Stock Alert" box
3. Note items that need reordering
4. Place orders with suppliers

### During Service
1. Update stock as items are used
2. Click **+** or **−** buttons to adjust
3. Monitor for items running out

### End of Day
1. Do a quick physical count
2. Update any discrepancies
3. Note items for next day's orders

### Weekly
1. Export inventory to CSV
2. Review total inventory value
3. Check supplier performance
4. Plan for upcoming week

---

## 🔍 Quick Reference

### Keyboard Shortcuts
- `Ctrl+F` - Search items
- `Ctrl+S` - Save (in modal)
- `Esc` - Close modal

### Stock Units
- **PCS** - Pieces (individual items)
- **KG** - Kilograms (weight)
- **PACK** - Packages
- **JAR** - Jars
- **BOTT** - Bottles
- **L** - Liters
- **CAN** - Cans
- **SACK** - Sacks

### Inventory Types
- **Daily** - Check every day (Carbs, Meat, Fresh, Sauces)
- **Weekly** - Check weekly (Flour, Rice, Eggs, Cheese)
- **Monthly** - Check monthly (Specialty items)
- **Every Other Week** - Check bi-weekly (Seasonings, Sauces)

---

## ⚠️ Important Notes

### Before You Start
- ✅ Backend must be running
- ✅ Database must be seeded
- ✅ You must be logged in

### Data Entry Tips
- Always enter current stock accurately
- Set minimum threshold based on daily usage
- Update supplier info for quick reordering
- Add location for easy finding

### Best Practices
- Update stock daily
- Check low stock alerts every morning
- Export weekly for records
- Keep supplier contact info updated

---

## 🆘 Troubleshooting

### "Items not loading"
- Check if backend is running
- Refresh the page
- Check browser console (F12)

### "Can't add/edit items"
- Make sure you're logged in
- Check backend connection
- Try refreshing

### "Stock not updating"
- Wait a moment for sync
- Refresh the page
- Check if item exists

### "Export not working"
- Check browser download settings
- Try a different browser
- Check if pop-ups are blocked

---

## 📞 Need Help?

1. **Check the full documentation** - See `INVENTORY_SYSTEM_README.md`
2. **Review API endpoints** - See backend routes
3. **Check browser console** - Press F12 for error messages
4. **Contact admin** - For system issues

---

## 🎓 Learning Path

**Beginner:**
1. View inventory items
2. Search and filter
3. Check stock status

**Intermediate:**
1. Add/edit items
2. Update stock quantities
3. Export data

**Advanced:**
1. Bulk operations
2. Supplier management
3. Cost analysis

---

**Happy Inventory Management! 📦**
