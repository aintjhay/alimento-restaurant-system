const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// POST - Create new order
router.post('/', async (req, res) => {
    try {
        const orderData = {
            ...req.body,
            status: 'pending',
            paymentStatus: 'unpaid'
        };

        const order = new Order(orderData);
        await order.save();

        console.log(`✅ Order created: ${order.orderNumber} for Table ${order.tableNumber}`);
        
        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: order
        });
    } catch (error) {
        console.error('❌ Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order',
            error: error.message
        });
    }
});

// GET - All orders (for dashboard)
router.get('/', async (req, res) => {
    try {
        const { status, startDate, endDate, limit = 50 } = req.query;
        
        let query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();
        
        // Calculate dashboard stats
        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        
        res.json({
            success: true,
            orders: orders,
            stats: {
                totalRevenue,
                totalOrders,
                pendingOrders,
                averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
            }
        });
    } catch (error) {
        console.error('❌ Fetch orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// GET - Today's orders and revenue
router.get('/today', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysOrders = await Order.find({
            createdAt: { $gte: today, $lt: tomorrow }
        }).sort({ createdAt: -1 });

        const todaysRevenue = todaysOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const activeTables = [...new Set(todaysOrders.map(order => order.tableNumber))];

        res.json({
            success: true,
            todaysOrders: todaysOrders,
            todaysStats: {
                revenue: todaysRevenue,
                orderCount: todaysOrders.length,
                activeTables: activeTables.length,
                averageOrderValue: todaysOrders.length > 0 ? todaysRevenue / todaysOrders.length : 0
            }
        });
    } catch (error) {
        console.error('❌ Today orders error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET - Top selling items
router.get('/top-items', async (req, res) => {
    try {
        const orders = await Order.find({})
            .select('items')
            .lean();

        const itemSales = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.name;
                if (!itemSales[key]) {
                    itemSales[key] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                itemSales[key].quantity += item.quantity;
                itemSales[key].revenue += item.price * item.quantity;
            });
        });

        const topItems = Object.values(itemSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            success: true,
            topItems: topItems
        });
    } catch (error) {
        console.error('❌ Top items error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH - Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            id,
            { status: status, updatedAt: new Date() },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: order
        });
    } catch (error) {
        console.error('❌ Update status error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
