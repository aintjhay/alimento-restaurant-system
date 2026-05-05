# Inventory System - Visual Guide

## 🎨 User Interface Overview

### Main Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVENTORY MANAGEMENT                         │
│                        Alimento                                 │
│                                                                 │
│  [Add Item] [Export CSV] [Refresh]                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📦 Total Items    ⚠️ Low Stock    💰 Total Value              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     85       │  │      12      │  │  ₱125,450   │          │
│  │ Active items │  │ Below min    │  │ Inventory   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ⚠️ LOW STOCK ALERT                                              │
│ 12 items are below minimum threshold                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 🔍 [Search items, supplier, location...]                       │
│                                                                 │
│ [All] [Carbs] [Meat] [Fresh] [Prepped Sauces] [Other] [Raw]  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ INVENTORY ITEMS (85)                                            │
├─────────────────────────────────────────────────────────────────┤
│ Item Name    │ Category │ Stock │ Unit │ Min │ Cost │ Value   │
├─────────────────────────────────────────────────────────────────┤
│ 110G CHORIZO │ Meat     │ 2 [+][-] │ PCS │ 5 │ ₱45 │ ₱90    │
│ TOMATO       │ Fresh    │ 2 [+][-] │ KG  │ 3 │ ₱80 │ ₱160   │
│ COOKED PASTA │ Carbs    │ 3 [+][-] │ PACK│ 5 │ ₱50 │ ₱150   │
│ ...          │ ...      │ ...      │ ... │ ..│ ... │ ...    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Status Indicators

### Stock Status Colors

```
🟢 GOOD STATUS
├─ Stock > 1.5 × Minimum Threshold
├─ Green background
└─ No action needed

🟡 WARNING STATUS
├─ Stock between Minimum and 1.5 × Minimum
├─ Orange background
└─ Monitor closely

🔴 LOW STATUS
├─ Stock ≤ Minimum Threshold
├─ Red background
└─ REORDER IMMEDIATELY
```

---

## 📋 Table Columns Explained

```
┌──────────────────────────────────────────────────────────────┐
│ Item Name        │ What you're tracking                      │
├──────────────────────────────────────────────────────────────┤
│ Category         │ Type: Meat, Fresh, Carbs, etc.           │
├──────────────────────────────────────────────────────────────┤
│ Current Stock    │ How much you have right now              │
│ [+] [-]          │ Quick buttons to add/remove              │
├──────────────────────────────────────────────────────────────┤
│ Unit             │ PCS, KG, PACK, JAR, BOTT, L, CAN, SACK  │
├──────────────────────────────────────────────────────────────┤
│ Min. Threshold   │ When to reorder (alert point)            │
├──────────────────────────────────────────────────────────────┤
│ Unit Cost        │ Price per unit (₱)                       │
├──────────────────────────────────────────────────────────────┤
│ Total Value      │ Current Stock × Unit Cost                │
├──────────────────────────────────────────────────────────────┤
│ Supplier         │ Where you buy it from                    │
├──────────────────────────────────────────────────────────────┤
│ Location         │ Where it's stored in kitchen             │
├──────────────────────────────────────────────────────────────┤
│ Status           │ 🟢 Good / 🟡 Warning / 🔴 Low           │
├──────────────────────────────────────────────────────────────┤
│ Actions          │ ✏️ Edit / 🗑️ Delete                     │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Stock Update Flow

### Quick Update (Using +/- Buttons)

```
1. Find item in table
   ↓
2. Click [+] to add or [-] to remove
   ↓
3. Enter quantity
   ↓
4. Stock updates instantly ✓
```

### Full Edit (Using Edit Button)

```
1. Click ✏️ Edit button
   ↓
2. Modal opens with all fields
   ↓
3. Update any information
   ↓
4. Click "Save Item"
   ↓
5. Changes saved ✓
```

---

## ➕ Add New Item Flow

```
┌─────────────────────────────────────────┐
│ Click "Add Item" Button                 │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ MODAL OPENS                             │
├─────────────────────────────────────────┤
│ Item Name *          [____________]     │
│ Category *           [Dropdown ▼]       │
│ Unit *               [Dropdown ▼]       │
│ Current Stock *      [____________]     │
│ Minimum Threshold *  [____________]     │
│ Unit Cost            [____________]     │
│ Supplier             [____________]     │
│ Location             [____________]     │
│ Expiry Date          [____________]     │
│ Remarks              [____________]     │
│                                         │
│ [Cancel]  [Save Item]                  │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│ Item Created Successfully ✓             │
│ Table updates automatically             │
└─────────────────────────────────────────┘
```

---

## 🔍 Search & Filter Flow

### Search by Name

```
Search Box: [110G CHORIZO]
           ↓
Results: Shows only items matching "110G CHORIZO"
```

### Filter by Category

```
Category Buttons: [All] [Carbs] [Meat] [Fresh] ...
                           ↓
                  Click [Meat]
                           ↓
                  Table shows only Meat items
```

### Combined Search + Filter

```
Category: [Meat] selected
Search: [CHORIZO]
           ↓
Results: Only Meat items with "CHORIZO" in name
```

---

## 📊 Summary Cards

### Card 1: Total Items
```
┌──────────────────┐
│ 📦 Total Items   │
├──────────────────┤
│      85          │
├──────────────────┤
│ Active items     │
└──────────────────┘
```

### Card 2: Low Stock
```
┌──────────────────┐
│ ⚠️ Low Stock     │
├──────────────────┤
│      12          │
├──────────────────┤
│ Below threshold  │
└──────────────────┘
```

### Card 3: Total Value
```
┌──────────────────┐
│ 💰 Total Value   │
├──────────────────┤
│  ₱125,450        │
├──────────────────┤
│ Inventory value  │
└──────────────────┘
```

---

## 🎨 Color Scheme

### Primary Colors
```
Teal Main:      #00796b  ████████████
Teal Accent:    #004d40  ████████████
Teal Light:     #e0f2f1  ████████████
```

### Status Colors
```
Good:           #4caf50  ████████████ (Green)
Warning:        #ff9800  ████████████ (Orange)
Low/Error:      #f44336  ████████████ (Red)
```

### Neutral Colors
```
White:          #ffffff  ████████████
Light Gray:     #f5f5f5  ████████████
Medium Gray:    #9e9e9e  ████████████
Dark Gray:      #424242  ████████████
```

---

## 📱 Responsive Breakpoints

### Desktop (1440px+)
```
┌─────────────────────────────────────────────────────────┐
│ Full width layout                                       │
│ All columns visible                                    │
│ Optimal viewing experience                            │
└─────────────────────────────────────────────────────────┘
```

### Laptop (1024px - 1440px)
```
┌──────────────────────────────────────────┐
│ Slightly compressed layout                │
│ All columns still visible                │
│ Good viewing experience                  │
└──────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌────────────────────────┐
│ Horizontal scroll      │
│ Some columns hidden    │
│ Touch-friendly buttons │
└────────────────────────┘
```

### Mobile (480px - 768px)
```
┌──────────────┐
│ Stacked      │
│ layout       │
│ Scrollable   │
│ table        │
└──────────────┘
```

### Small Mobile (<480px)
```
┌────────┐
│ Minimal│
│ layout │
│ Cards  │
│ stack  │
└────────┘
```

---

## 🔔 Alert Box

### Low Stock Alert
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ LOW STOCK ALERT                                      │
├─────────────────────────────────────────────────────────┤
│ 12 items are below minimum threshold                    │
│                                                         │
│ Action: Check table for 🔴 items and reorder           │
└─────────────────────────────────────────────────────────┘
```

---

## 📤 Export CSV

### Export Process
```
Click [Export CSV]
        ↓
File generated
        ↓
Download starts
        ↓
File: inventory-2026-05-05.csv
        ↓
Open in Excel/Sheets
```

### CSV Format
```
Item Name,Category,Current Stock,Unit,Min Threshold,Unit Cost,Total Value,Supplier,Location,Remarks
110G CHORIZO,Meat,2,PCS,5,45,90,Local Supplier,Freezer,<5
TOMATO,Fresh,2,KG,3,80,160,Market,Fridge,<3
...
```

---

## ⌨️ Keyboard Shortcuts

```
Ctrl+F    Search items
Ctrl+S    Save (in modal)
Esc       Close modal
Tab       Navigate fields
Enter     Submit form
```

---

## 🎯 Daily Workflow Visual

### Morning Routine
```
1. Open Inventory
   ↓
2. Check Low Stock Alert
   ↓
3. Review 🔴 Red Items
   ↓
4. Note items to reorder
   ↓
5. Contact suppliers
```

### During Service
```
1. Item used
   ↓
2. Find in table
   ↓
3. Click [-] button
   ↓
4. Enter quantity used
   ↓
5. Stock updates
```

### End of Day
```
1. Physical count
   ↓
2. Compare with system
   ↓
3. Update discrepancies
   ↓
4. Note for next day
```

---

## 📊 Category Icons

```
📦 Carbs
🥩 Meat
🥬 Fresh
🍯 Prepped Sauces
🛒 Other Food Items
🧂 Raw Sauces
🌿 Herbs and Seasonings
```

---

## 🚀 Quick Actions

### Most Common Actions

```
1. Check Stock
   └─ Open Inventory page

2. Update Stock
   └─ Click [+] or [-] button

3. Add Item
   └─ Click [Add Item] button

4. Search Item
   └─ Type in search box

5. Export Data
   └─ Click [Export CSV] button

6. Edit Item
   └─ Click ✏️ Edit button

7. Delete Item
   └─ Click 🗑️ Delete button
```

---

## 💡 Tips & Tricks

### Tip 1: Quick Stock Update
```
Use [+] and [-] buttons for fast updates
No need to open full edit modal
```

### Tip 2: Search Efficiently
```
Search by: Name, Supplier, or Location
Combine with category filter for precision
```

### Tip 3: Export Regularly
```
Export weekly for backup
Use for analysis and reporting
```

### Tip 4: Monitor Alerts
```
Check Low Stock Alert every morning
Prevents running out of items
```

### Tip 5: Use Remarks
```
Add notes for special items
Helps team understand requirements
```

---

## 🎓 Learning Path

### Beginner (Day 1)
```
✓ View inventory
✓ Search items
✓ Check status
```

### Intermediate (Week 1)
```
✓ Update stock
✓ Add items
✓ Edit items
```

### Advanced (Week 2+)
```
✓ Bulk operations
✓ Export data
✓ Analyze trends
```

---

## ✨ Visual Hierarchy

### Most Important
```
🔴 Low Stock Items (Red)
⚠️ Alert Box
Summary Cards
```

### Important
```
🟡 Warning Items (Orange)
Search/Filter Controls
Action Buttons
```

### Supporting
```
🟢 Good Items (Green)
Supplier Info
Location Info
```

---

**Visual Guide Complete! 🎨**

For more details, see the full documentation.
