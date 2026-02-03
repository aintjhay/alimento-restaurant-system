const MenuItem = require('../models/MenuItem');

exports.getAllMenuItems = async (req, res) => {
    try {
        const items = await MenuItem.find().sort({ category: 1, name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMenuItem = async (req, res) => {
    try {
        const menuItem = new MenuItem(req.body);
        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json(item);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ error: 'Menu item not found' });
        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByCategory = async (req, res) => {
    try {
        const items = await MenuItem.find({ 
            category: req.params.category,
            isAvailable: true 
        }).sort({ name: 1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
