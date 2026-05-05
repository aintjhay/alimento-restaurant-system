# Alimento Inventory Management System

## Overview

The Inventory Management System is a comprehensive solution for tracking and managing restaurant inventory across multiple categories. It matches the Alimento restaurant's design theme and provides real-time stock monitoring, low-stock alerts, and detailed inventory analytics.

## Features

### ✅ Core Features
- **Real-time Inventory Tracking** - Monitor stock levels across all categories
- **Low Stock Alerts** - Automatic warnings when items fall below minimum threshold
- **Multi-Category Support** - Organize inventory by 8 different categories
- **Stock Operations** - Add, subtract, or set stock quantities
- **Inventory Types** - Track Daily, Weekly, Monthly, and Every Other Week items
- **Supplier Management** - Track supplier information for each item
- **Cost Tracking** - Monitor unit costs and total inventory value
- **Search & Filter** - Quick search and category filtering
- **Export to CSV** - Generate inventory reports for analysis
- **Responsive Design** - Works on desktop, tablet, and mobile devices

### 📊 Dashboard Features
- **Summary Cards** - Total items, low stock count, total inventory value
- **Status Indicators** - Visual indicators for stock status (Good, Warning, Low)
- **Category Breakdown** - View inventory value by category
- **Real-time Updates** - Auto-refresh every 30 seconds

### 🎯 Inventory Categories
1. **Carbs** - Pasta, bread, buns
2. **Meat** - Chorizo, bacon, chicken, beef, seafood
3. **Fresh** - Vegetables and fresh ingredients
4. **Prepped Sauces** - Pre-made sauces and oils
5. **Other Food Items** - Flour, rice, eggs, cheese, etc.
6. **Raw Sauces** - Condiments and sauce bases
7. **Herbs and Seasonings** - Spices and seasonings

## Installation & Setup

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Seed Inventory Data**
   ```bash
   node seedInventory.js
   ```
   This will populate the database with all inventory items from your restaurant.

3. **Start Backend Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

### Frontend Setup

1. **Access Inventory Page**
   - Navigate to `/inventory` route in your application
   - The page is protected and requires authentication

2. **Features Available**
   - View all inventory items
   - Add new items
   - Edit existing items
   - Update stock quantities
   - Delete items
   - Export inventory to CSV

## API Endpoints

### Get All Inventory Items
```
GET /api/inventory
Query Parameters:
  - category: Filter by category
  - isActive: Filter by active status (true/false)
  - inventoryType: Filter by inventory type
```

### Get Items by Category
```
GET /api/inventory/category/:category
```

### Get Low Stock Items
```
GET /api/inventory/alerts/low-stock
```

### Get Inventory Summary
```
GET /api/inventory/summary/overview
```

### Create New Item
```
POST /api/inventory
Body: {
  name: string,
  category: string,
  unit: string,
  currentStock: number,
  minimumThreshold: number,
  unitCost: number,
  supplier: string,
  location: string,
  remarks: string,
  inventoryType: string
}
```

### Update Item
```
PATCH /api/inventory/:id
Body: { ...fields to update }
```

### Update Stock Quantity
```
PATCH /api/inventory/:id/stock
Body: {
  quantity: number,
  action: 'add' | 'subtract' | 'set'
}
```

### Bulk Update Stock
```
POST /api/inventory/bulk/update-stock
Body: {
  updates: [
    { id: string, quantity: number, action: string },
    ...
  ]
}
```

### Delete Item
```
DELETE /api/inventory/:id
```

### Deactivate Item (Soft Delete)
```
PATCH /api/inventory/:id/deactivate
```

## Data Model

### Inventory Item Schema
```javascript
{
  name: String,                    // Item name
  category: String,                // Category (enum)
  unit: String,                    // Unit of measurement (PCS, KG, PACK, JAR, BOTT, L, CAN, SACK)
  currentStock: Number,            // Current quantity in stock
  minimumThreshold: Number,        // Minimum quantity before alert
  maximumCapacity: Number,         // Maximum storage capacity
  reorderQuantity: Number,         // Quantity to reorder
  unitCost: Number,                // Cost per unit
  supplier: String,                // Supplier name
  location: String,                // Storage location in kitchen
  expiryDate: Date,                // Expiration date
  remarks: String,                 // Additional notes
  isActive: Boolean,               // Active status
  inventoryType: String,           // Daily, Weekly, Monthly, Every Other Week
  lastRestocked: Date,             // Last restock date
  createdAt: Date,                 // Creation timestamp
  updatedAt: Date                  // Last update timestamp
}
```

## Usage Guide

### Adding a New Item
1. Click "Add Item" button
2. Fill in the required fields:
   - Item Name
   - Category
   - Unit of Measurement
   - Current Stock
   - Minimum Threshold
3. (Optional) Add supplier, location, cost, and remarks
4. Click "Save Item"

### Updating Stock
**Quick Update (from table):**
1. Click the + or − buttons next to the stock quantity
2. Enter the quantity to add/subtract
3. Stock updates automatically

**Full Edit:**
1. Click the edit icon (pencil) in the Actions column
2. Modify the stock quantity
3. Click "Save Item"

### Monitoring Low Stock
- Low stock items appear with a red background in the table
- The "Low Stock Alert" box shows the count of items below threshold
- Items with status "🔴 Low" need immediate reordering

### Exporting Data
1. Click "Export CSV" button
2. A CSV file will be downloaded with all current inventory data
3. Use for analysis, reporting, or backup

### Filtering & Searching
- Use the search box to find items by name, supplier, or location
- Click category buttons to filter by category
- Combine search and category filters for precise results

## Stock Status Indicators

| Status | Color | Meaning |
|--------|-------|---------|
| 🟢 Good | Green | Stock above 1.5x minimum threshold |
| 🟡 Warning | Orange | Stock between minimum and 1.5x minimum |
| 🔴 Low | Red | Stock at or below minimum threshold |

## Best Practices

### Daily Operations
1. **Morning Check** - Review low stock alerts
2. **Stock Updates** - Update quantities after receiving deliveries
3. **Usage Tracking** - Record stock used during service
4. **End of Day** - Verify counts match physical inventory

### Weekly Tasks
1. **Inventory Count** - Physical count of all items
2. **Discrepancy Check** - Compare system vs. physical counts
3. **Supplier Orders** - Place orders for low stock items
4. **Report Generation** - Export and review inventory reports

### Monthly Tasks
1. **Full Audit** - Complete inventory audit
2. **Cost Analysis** - Review inventory value trends
3. **Supplier Review** - Evaluate supplier performance
4. **Forecast Planning** - Plan for upcoming events/seasons

## Troubleshooting

### Items Not Showing
- Ensure backend server is running
- Check that items are marked as `isActive: true`
- Verify category filter is set to "All"

### Stock Updates Not Saving
- Check backend connection
- Verify item ID is valid
- Check browser console for error messages

### Low Stock Alerts Not Appearing
- Verify minimum threshold is set correctly
- Ensure current stock is below threshold
- Refresh the page to see updates

### Export Not Working
- Check browser's download settings
- Ensure pop-ups are not blocked
- Try a different browser if issue persists

## Performance Tips

1. **Search Efficiently** - Use specific search terms
2. **Filter by Category** - Reduces data load
3. **Regular Exports** - Keep backup copies of inventory data
4. **Archive Old Items** - Deactivate items no longer used
5. **Batch Updates** - Use bulk update for multiple items

## Security Considerations

- Inventory data is protected by authentication
- Only authenticated users can access inventory
- All changes are logged with timestamps
- Sensitive supplier information is stored securely

## Future Enhancements

- [ ] Barcode scanning for quick stock updates
- [ ] Automated reorder suggestions based on usage patterns
- [ ] Integration with supplier ordering systems
- [ ] Inventory forecasting using demand data
- [ ] Multi-location inventory tracking
- [ ] Expiry date tracking and alerts
- [ ] Inventory history and audit logs
- [ ] Mobile app for on-the-go updates

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for error messages
4. Contact system administrator

## Version History

### v1.0.0 (Current)
- Initial release
- Core inventory management features
- Real-time stock tracking
- Low stock alerts
- CSV export functionality
- Responsive design

---

**Last Updated:** May 2026
**System:** Alimento Restaurant Management System
