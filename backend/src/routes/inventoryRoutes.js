const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const mongoose = require('mongoose');
const Movement = require('../models/StockMovement');
async function adjust(id, body, req, session) {
  const item = await Inventory.findById(id).session(session);
  if (!item) throw new Error('Inventory item not found');
  const before = item.currentStock;
  changeStock(item, body);
  await item.save({ session });
  await Movement.create([{ inventoryId: item._id, quantity: item.currentStock - before, kind: 'adjustment', actor: actor(req), reason: String(body.reason || body.action).slice(0, 500) }], { session });
  return item;
}

const { initializeBatches, changeStock, expirationAlerts, validExpiryDate } = require('../services/stockBatches');
const editable = body => Object.fromEntries(['productId', 'name', 'category', 'unit', 'minimumThreshold', 'maximumCapacity', 'reorderQuantity', 'unitCost', 'supplier', 'location', 'remarks', 'inventoryType'].filter(key => body[key] !== undefined).map(key => [key, body[key]]));
const actor = req => String(req.user?.userId || req.user?.email || 'admin');

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
      items: items.map(item => ({ ...item.toObject(), expirationAlerts: expirationAlerts(item) }))
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
    const payload = { ...editable(req.body), productId: req.body.productId || undefined, currentStock: Number(req.body.currentStock || 0), expiryDate: req.body.expiryDate || null };
    if (await Inventory.exists({ name: new RegExp('^' + String(payload.name || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i'), deletedAt: null })) return res.status(409).json({ error: 'An item with this name already exists. Restock the existing item instead.' });
    if (!validExpiryDate(req.body.expiryDate)) throw new Error('Enter a valid expiry date');
    const newItem = new Inventory(payload);
    initializeBatches(newItem);
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
    const updated = await Inventory.findById(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    if (req.body.currentStock !== undefined && Number(req.body.currentStock) !== updated.currentStock) return res.status(400).json({ error: 'Use Restock or Remove stock to adjust batch quantities' });
    if (req.body.batchExpiries !== undefined) {
      if (!Array.isArray(req.body.batchExpiries)) throw new Error('Invalid batch details');
      for (const entry of req.body.batchExpiries) {
        const batch = updated.batches.id(entry._id);
        if (!batch || !validExpiryDate(entry.expiryDate)) throw new Error('Invalid batch or expiry date');
        batch.expiryDate = entry.expiryDate || null;
      }
    }
    if (!updated.batches.length && req.body.expiryDate !== undefined) {
      if (!validExpiryDate(req.body.expiryDate)) throw new Error('Enter a valid expiry date');
      updated.expiryDate = req.body.expiryDate || null;
      initializeBatches(updated);
    }
    Object.assign(updated, editable(req.body));
    if (!updated.productId) updated.productId = undefined;
    await updated.save();

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
    const { action } = req.body;
    const updated = await require('../services/transaction')(session => adjust(req.params.id, req.body, req, session));

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
    
    if (!Array.isArray(updates) || !updates.length || updates.length > 100) throw new Error('Supply 1 to 100 stock updates');
    const results = await require('../services/transaction')(async session => {
      const result = [];
      for (const update of updates) result.push(await adjust(update.id, update, req, session));
      return result;
    });

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
    const deleted = await Inventory.findByIdAndUpdate(req.params.id, { $inc: { __v: 1 }, $set: { deletedAt: new Date(), deletedBy: actor(req) }, $push: { deletionHistory: { action: 'deleted', at: new Date(), by: actor(req) } } }, { new: true });
    
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


router.get('/alerts/expiration', async (_req, res) => {
  try {
    const items = await Inventory.find({ isActive: true });
    res.json({ success: true, items: items.map(item => ({ _id: item._id, name: item.name, unit: item.unit, batches: expirationAlerts(item) })).filter(item => item.batches.length) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

module.exports = router;
