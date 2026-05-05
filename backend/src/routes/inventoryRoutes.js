const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Get all inventory items
router.get('/', async (req, res) => {
  try {
    const { category, isActive, inventoryType } = req.query;
    let query = {};

    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (inventoryType) query.inventoryType = inventoryType;

    const items = await Inventory.find(query).sort({ category: 1, name: 1 });
    
    res.json({
      success: true,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory by category
router.get('/category/:category', async (req, res) => {
  try {
    const items = await Inventory.find({ 
      category: req.params.category,
      isActive: true 
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      category: req.params.category,
      count: items.length,
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minimumThreshold'] },
      isActive: true
    }).sort({ currentStock: 1 });

    res.json({
      success: true,
      count: lowStockItems.length,
      items: lowStockItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory summary
router.get('/summary/overview', async (req, res) => {
  try {
    const allItems = await Inventory.find({ isActive: true });
    
    const lowStockCount = allItems.filter(item => item.currentStock <= item.minimumThreshold).length;
    const totalItems = allItems.length;
    const totalValue = allItems.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0);
    
    const categoryBreakdown = {};
    allItems.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { count: 0, value: 0 };
      }
      categoryBreakdown[item.category].count++;
      categoryBreakdown[item.category].value += item.currentStock * item.unitCost;
    });

    res.json({
      success: true,
      summary: {
        totalItems,
        lowStockCount,
        totalInventoryValue: totalValue,
        categoryBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new inventory item
router.post('/', async (req, res) => {
  try {
    const newItem = new Inventory(req.body);
    const saved = await newItem.save();
    
    res.status(201).json({
      success: true,
      message: 'Inventory item created',
      item: saved
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update inventory item
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Inventory item updated',
      item: updated
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, action } = req.body; // action: 'add', 'subtract', 'set'
    
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    let newStock = item.currentStock;
    
    if (action === 'add') {
      newStock += quantity;
    } else if (action === 'subtract') {
      newStock = Math.max(0, newStock - quantity);
    } else if (action === 'set') {
      newStock = quantity;
    }

    item.currentStock = newStock;
    item.lastRestocked = new Date();
    const updated = await item.save();

    res.json({
      success: true,
      message: `Stock ${action}ed successfully`,
      item: updated
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk update stock
router.post('/bulk/update-stock', async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, quantity, action }
    
    const results = [];
    for (const update of updates) {
      const item = await Inventory.findById(update.id);
      if (item) {
        let newStock = item.currentStock;
        
        if (update.action === 'add') {
          newStock += update.quantity;
        } else if (update.action === 'subtract') {
          newStock = Math.max(0, newStock - update.quantity);
        } else if (update.action === 'set') {
          newStock = update.quantity;
        }

        item.currentStock = newStock;
        item.lastRestocked = new Date();
        const updated = await item.save();
        results.push(updated);
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} items`,
      items: results
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete inventory item
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Inventory item deleted'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Soft delete (deactivate)
router.patch('/:id/deactivate', async (req, res) => {
  try {
    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Inventory item deactivated',
      item: updated
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
