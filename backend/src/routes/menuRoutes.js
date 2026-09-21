const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const ProductCategory = require('../models/ProductCategory');

// ==================== FIXED ROUTE ORDER ====================
// Specific routes must come BEFORE parameterized routes

// GET categories list
router.get('/categories/list', async (req, res) => {
    try {
        const managed = await ProductCategory.find({ isActive: true }).sort({ displayOrder: 1, name: 1 }).select('name').lean();
        const categories = managed.length ? managed.map(category => category.name) : await MenuItem.distinct('category', { deletedAt: null });
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

// GET a paginated product list. The page size is intentionally fixed at 8.
router.get('/', async (req, res) => {
    try {
        const pageSize = 8;
        const requestedPage = Number.parseInt(req.query.page, 10);
        const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
        const query = {};

        if (req.query.available !== 'all') query.isAvailable = true;
        if (req.query.category && req.query.category !== 'All') query.category = req.query.category;
        if (req.query.search?.trim()) {
            const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { description: { $regex: escaped, $options: 'i' } }
            ];
        }

        const totalItems = await MenuItem.countDocuments(query);
        const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        const safePage = Math.min(page, totalPages);
        const items = await MenuItem.find(query)
            .sort({ displayOrder: 1, category: 1, name: 1 })
            .skip((safePage - 1) * pageSize)
            .limit(pageSize)
            .lean();
        
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
        res.json({
            success: true,
            data: transformedItems,
            pagination: {
                page: safePage,
                pageSize,
                totalItems,
                totalPages,
                hasPreviousPage: safePage > 1,
                hasNextPage: safePage < totalPages
            }
        });
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
