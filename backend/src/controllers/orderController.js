const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

exports.createOrder = async (req, res) => {
    try {
        const orderData = req.body;
        
        // Calculate total
        let totalAmount = 0;
        for (const item of orderData.items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) {
                return res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
            }
            totalAmount += menuItem.price * item.quantity;
        }
        
        orderData.totalAmount = totalAmount;
        const order = new Order(orderData);
        await order.save();
        
        res.status(201).json({
            success: true,
            order: order
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ createdAt: -1 })
            .populate('items.menuItemId', 'name price');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.menuItemId', 'name price category');
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTodaysOrders = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const orders = await Order.find({
            createdAt: { $gte: todayStart, $lt: todayEnd }
        }).sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);
        
        const todaysOrders = await Order.find({
            createdAt: { $gte: todayStart, $lt: todayEnd },
            status: { $nin: ['Cancelled'] }
        });
        
        const totalRevenue = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = todaysOrders.length;
        
        const activeOrders = todaysOrders.filter(order => 
            ['Pending', 'Preparing', 'Ready'].includes(order.status)
        );
        const activeTables = [...new Set(activeOrders.map(order => order.tableNumber))].length;
        
        res.json({
            totalRevenue,
            totalOrders,
            activeTables,
            todaysOrdersCount: totalOrders
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate('items.menuItemId', 'name price');
        
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};