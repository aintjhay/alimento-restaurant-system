const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// ==================== FIXED ROUTE ORDER ====================
// Specific routes must come BEFORE parameterized routes

// GET complete menu items (for debugging)
router.get('/complete', async (req, res) => {
    try {
        const items = await MenuItem.find()
            .sort({ displayOrder: 1, category: 1, name: 1 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching complete menu:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET categories list
router.get('/categories/list', async (req, res) => {
    try {
        const categories = await MenuItem.distinct('category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET menu items by category
router.get('/category/:category', async (req, res) => {
    try {
        const items = await MenuItem.find({ 
            category: req.params.category,
            isAvailable: true 
        }).sort({ displayOrder: 1, name: 1 });
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET all menu items (MAIN ENDPOINT - for POS)
router.get('/', async (req, res) => {
    try {
        const items = await MenuItem.find()
            .sort({ displayOrder: 1, category: 1, name: 1 });
        
        // Transform for compatibility with existing frontend
        const transformedItems = items.map(item => ({
            id: item._id,
            code: item.code || `MENU-${item._id.toString().slice(-6)}`,
            name: item.name,
            price: item.price,
            category: item.category,
            is_available: item.isAvailable,
            description: item.description,
            image: item.image,
            modifiers: item.modifiers || [],
            addons: item.addons || [],
            preparationTime: item.preparationTime,
            tags: item.tags || []
        }));
        
        console.log(`📊 Sent ${transformedItems.length} menu items to frontend`);
        res.json(transformedItems);
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET single menu item by ID
router.get('/:id', async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;